import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ReactToPrint from 'react-to-print';

const CvGenerator = () => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const location = useLocation();
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tokenFromUrl = queryParams.get("token");
    const userFromUrl = queryParams.get("user");

    if (tokenFromUrl && userFromUrl) {
      setToken(tokenFromUrl);
      setUser(JSON.parse(decodeURIComponent(userFromUrl)));
    }
  }, [location]);

  useEffect(() => {
    if (token) {
      fetch("https://api.github.com/user/repos", {
        headers: { Authorization: `token ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setRepos(data));
    }
  }, [token]);

  if (!token || !user) {
    return <div className="text-center mt-20 text-lg">Loading...</div>;
  }

  return (
    <div className="p-6 flex flex-col items-center">
      <ReactToPrint
        trigger={() => <Button className="mb-4">Download CV</Button>}
        content={() => componentRef.current}
      />
      <div ref={componentRef} className="max-w-3xl w-full space-y-4">
        <Card className="shadow-lg">
          <CardContent className="p-6 flex flex-col md:flex-row items-center gap-4">
            <img
              src={user.avatar_url}
              alt="avatar"
              className="w-32 h-32 rounded-full shadow-md"
            />
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-gray-600">{user.bio}</p>
              <p className="text-sm text-muted-foreground mt-1">
                GitHub: <a className="underline" href={user.html_url}>{user.login}</a>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-2">Top Repositories</h2>
            <ul className="space-y-2">
              {repos.slice(0, 5).map((repo) => (
                <li key={repo.id} className="border-b pb-2">
                  <a
                    href={repo.html_url}
                    className="font-medium text-blue-600"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {repo.name}
                  </a>
                  <p className="text-sm text-muted-foreground">{repo.description}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-2">Contact & Info</h2>
            <p><strong>Email:</strong> {user.email || "N/A"}</p>
            <p><strong>Location:</strong> {user.location || "N/A"}</p>
            <p><strong>Joined GitHub:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CvGenerator;
