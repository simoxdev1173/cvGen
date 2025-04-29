import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom'; // Requires react-router-dom
import { Button } from "@/components/ui/button"; // Assumes shadcn/ui Button
import { Card, CardContent } from "@/components/ui/card"; // Assumes shadcn/ui Card
import { useReactToPrint } from 'react-to-print'; // Requires react-to-print

const CvGenerator = () => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null); // TODO: Define a User type
  const [repos, setRepos] = useState<any[]>([]); // TODO: Define a Repo type
  const location = useLocation();
  const componentRef = useRef<HTMLDivElement>(null); // Ref for printable area

  // Extract token and user data from URL params
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tokenFromUrl = queryParams.get("token");
    const userFromUrl = queryParams.get("user");

    if (tokenFromUrl && userFromUrl) {
      setToken(tokenFromUrl);
      try {
        setUser(JSON.parse(decodeURIComponent(userFromUrl)));
      } catch (error) {
        console.error("Failed to parse user data from URL:", error);
      }
    }
  }, [location]);

  // Fetch user repos from GitHub API when token is available
  useEffect(() => {
    if (token) {
      fetch("https://api.github.com/user/repos", { // Fetches authenticated user's repos
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json', // Recommended GitHub API header
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          // Sort repos by stars (descending)
          const sortedRepos = data.sort((a: any, b: any) => b.stargazers_count - a.stargazers_count);
          setRepos(sortedRepos);
        })
        .catch((error) => console.error("Failed to fetch GitHub repos:", error));
    }
  }, [token]);

  // Configure printing
  const handlePrint = useReactToPrint({
    documentTitle: user ? `${user.login}_CV` : 'GitHub_CV',
    bodyClass: "print-body", // Class added to body during print
    // Content is implicitly the component attached to componentRef
  });

  // Loading state
  if (!token || !user) {
    return <div className="text-center mt-20 text-lg font-semibold">Loading GitHub Data...</div>;
  }

  // Render CV
  return (
    <div className="p-6 flex flex-col items-center bg-gray-50 min-h-screen font-sans">
      {/* Print trigger button (hidden in print) */}
      <Button
        className="mb-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-300 ease-in-out transform hover:-translate-y-1 print-hide"
        onClick={handlePrint}
      >
        Download CV as PDF
      </Button>

      {/* Inline styles for @media print */}
      <style>
        {`
          @media print {
            body.print-body { /* Styles for the body tag during print */
              font-size: 12px;
              line-height: 1.5;
              margin: 0;
              padding: 0;
              background-color: #fff;
              -webkit-print-color-adjust: exact; /* Ensure colors print */
              print-color-adjust: exact;
            }
            .print-hide { display: none !important; } /* Hide elements in print */
            .print-container { /* Styles for the main CV container in print */
              max-width: 100%;
              width: 100%;
              box-shadow: none;
              border: none;
              margin: 0;
              padding: 15mm; /* Print margin */
              page-break-inside: avoid;
            }
            .print-container img { /* Smaller avatar in print */
              width: 80px !important;
              height: 80px !important;
              margin-bottom: 15px;
              border-radius: 50%;
            }
            .print-container h1, .print-container h2 { /* Print heading styles */
              font-size: 16px;
              color: #000;
              margin-bottom: 8px;
            }
            .print-container h1 { font-size: 18px; }
            .print-container p, .print-container li, .print-container a { /* Print text styles */
              font-size: 12px;
              color: #333;
            }
            .print-container a { color: #0000EE; text-decoration: underline; } /* Print link style */
            .print-card { /* Avoid breaking cards across pages */
               page-break-inside: avoid;
               margin-bottom: 15px;
               box-shadow: none;
               border: 1px solid #eee;
            }
            .print-card-content { padding: 10px; } /* Reduced padding in print */
            .print-repo-item { /* Repo item style in print */
                border-bottom: 1px solid #eee;
                padding-bottom: 8px;
                margin-bottom: 8px;
            }
          }
        `}
      </style>

      {/* Main printable content area */}
      <div ref={componentRef} className="max-w-3xl w-full space-y-6 print-container">

        {/* User Profile Card */}
        <Card className="shadow-lg rounded-lg overflow-hidden print-card">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6 print-card-content">
            <img
              src={user.avatar_url}
              alt={`${user.login} avatar`}
              className="w-32 h-32 rounded-full shadow-md border-4 border-white"
              onError={(e) => { // Fallback image on error
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = `https://placehold.co/128x128/E0E0E0/757575?text=${user.login?.[0]?.toUpperCase() ?? '?'}`;
                }}
            />
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold text-gray-800">{user.name || user.login}</h1>
              <p className="text-gray-600 mt-1">{user.bio || "No bio provided."}</p>
              <p className="text-sm text-gray-500 mt-2">
                GitHub: <a className="text-blue-600 hover:underline" href={user.html_url} target="_blank" rel="noopener noreferrer">{user.login}</a>
              </p>
               <p className="text-sm text-gray-500 mt-1">Followers: {user.followers} · Following: {user.following}</p>
            </div>
          </CardContent>
        </Card>

        {/* Top Repositories Card */}
        <Card className="shadow-md rounded-lg overflow-hidden print-card">
          <CardContent className="p-6 print-card-content">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Top Repositories (by stars)</h2>
            {repos.length > 0 ? (
              <ul className="space-y-3">
                {/* Display top 5 repos */}
                {repos.slice(0, 5).map((repo) => (
                  <li key={repo.id} className="border-b border-gray-200 pb-3 print-repo-item">
                    <a
                      href={repo.html_url}
                      className="font-semibold text-blue-700 hover:underline text-lg"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {repo.name}
                    </a>
                    <p className="text-sm text-gray-600 mt-1">{repo.description || "No description."}</p>
                     <p className="text-xs text-gray-500 mt-1">
                       ⭐ {repo.stargazers_count} | Language: {repo.language || 'N/A'} | Last updated: {new Date(repo.updated_at).toLocaleDateString()}
                     </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No public repositories found.</p>
            )}
          </CardContent>
        </Card>

        {/* Contact & Info Card */}
        <Card className="shadow-md rounded-lg overflow-hidden print-card">
          <CardContent className="p-6 print-card-content">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Contact & Info</h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>Email:</strong> {user.email || <span className="text-gray-500">Not publicly available</span>}</p>
              <p><strong>Location:</strong> {user.location || <span className="text-gray-500">Not specified</span>}</p>
              {user.blog && (
                 <p><strong>Website/Blog:</strong> <a href={user.blog.startsWith('http') ? user.blog : `http://${user.blog}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{user.blog}</a></p>
              )}
              <p><strong>Joined GitHub:</strong> {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
               <p><strong>Public Repos:</strong> {user.public_repos}</p>
               <p><strong>Public Gists:</strong> {user.public_gists}</p>
            </div>
          </CardContent>
        </Card>

      </div>
       {/* Second print button (hidden in print) */}
       <Button
        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-300 ease-in-out transform hover:-translate-y-1 print-hide"
        onClick={handlePrint}
      >
        Download CV as PDF
      </Button>
    </div>
  );
};

export default CvGenerator;

