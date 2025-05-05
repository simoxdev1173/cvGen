import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useReactToPrint } from 'react-to-print';

const CvGenerator = () => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const location = useLocation();
  const componentRef = useRef<HTMLDivElement>(null);

  // Securely exchange code for token + user info
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get("code");

    if (code) {
      fetch("https://cvgen-backend.onrender.com/auth/github/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("GitHub login failed");
          return res.json();
        })
        .then((data) => {
          setToken(data.token);
          setUser(data.user);
        })
        .catch((err) => console.error("Auth failed:", err));
    }
  }, [location]);

  // Fetch repos once we have token
  useEffect(() => {
    if (token) {
      fetch("https://api.github.com/user/repos", {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          const sorted = data.sort(
            (a: any, b: any) => b.stargazers_count - a.stargazers_count
          );
          setRepos(sorted);
        })
        .catch((err) => console.error("Repo fetch failed:", err));
    }
  }, [token]);

  const handlePrint = useReactToPrint({
    documentTitle: user ? `${user.login}_CV` : 'GitHub_CV',
    pageStyle: `
      @page { size: A4; margin: 1cm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .print-hide { display: none !important; }
        .break-after { page-break-after: always; }
        .break-before { page-break-before: always; }
        .break-inside { page-break-inside: avoid; }
      }
    `
  });

  if (!token || !user) {
    return <div className="text-center mt-20 text-lg font-semibold">Loading GitHub Data...</div>;
  }

  // Calculate total stars and forks
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
  const topLanguages = repos.reduce((acc: Record<string, number>, repo) => {
    if (repo.language) {
      acc[repo.language] = (acc[repo.language] || 0) + 1;
    }
    return acc;
  }, {});
  const sortedLanguages = Object.entries(topLanguages)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5);

  return (
    <div className="p-6 flex flex-col items-center bg-gray-50 min-h-screen font-sans">
      <Button
        className="mb-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-300 ease-in-out transform hover:-translate-y-1 print-hide"
        onClick={handlePrint}
      >
        Download CV as PDF
      </Button>

      <div ref={componentRef} className="w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-8">
          <div className="flex flex-col md:flex-row items-center">
            <img 
              src={user.avatar_url} 
              alt={`${user.name || user.login}'s avatar`} 
              className="w-32 h-32 rounded-full border-4 border-white mb-4 md:mb-0 md:mr-8"
            />
            <div>
              <h1 className="text-3xl font-bold">{user.name || user.login}</h1>
              <p className="text-xl text-blue-200">{user.bio || 'GitHub Developer'}</p>
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>{user.location || 'Location not specified'}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <a href={user.html_url} className="flex items-center text-blue-200 hover:text-white">
                  <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  <span>GitHub Profile</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700">{repos.length}</div>
            <div className="text-gray-600">Repositories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700">{totalStars}</div>
            <div className="text-gray-600">Total Stars</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700">{totalForks}</div>
            <div className="text-gray-600">Total Forks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700">{user.followers}</div>
            <div className="text-gray-600">Followers</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8">
          {/* Top Languages */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-200 pb-2 mb-4">Top Languages</h2>
            <div className="flex flex-wrap gap-4">
              {sortedLanguages.map(([language, count]) => (
                <div key={language} className="flex items-center bg-blue-50 px-4 py-2 rounded-full">
                  <span className="font-semibold text-blue-800">{language}</span>
                  <span className="ml-2 text-sm text-gray-600">({count} repos)</span>
                </div>
              ))}
            </div>
          </section>

          {/* Featured Projects */}
          <section className="mb-8 break-inside-avoid">
            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-200 pb-2 mb-4">Featured Projects</h2>
            <div className="grid gap-6">
              {repos.slice(0, 5).map((repo) => (
                <Card key={repo.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-blue-700">
                          <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {repo.name}
                          </a>
                        </h3>
                        <p className="text-gray-600 mt-1">{repo.description || 'No description provided'}</p>
                        <div className="flex flex-wrap gap-3 mt-3">
                          {repo.language && (
                            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {repo.language}
                            </span>
                          )}
                          <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            {new Date(repo.updated_at).toLocaleDateString()}
                          </span>
                          <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            {repo.forks_count}
                          </span>
                          <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                            {repo.stargazers_count}
                          </span>
                        </div>
                      </div>
                      {repo.homepage && (
                        <a 
                          href={repo.homepage.startsWith('http') ? repo.homepage : `https://${repo.homepage}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded hover:bg-green-200 transition-colors"
                        >
                          Live Demo
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* All Repositories */}
          <section className="break-inside-avoid">
            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-200 pb-2 mb-4">All Repositories</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stars</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {repos.slice(5).map((repo) => (
                    <tr key={repo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {repo.name}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {repo.language || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {repo.stargazers_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {repo.forks_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(repo.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 p-4 text-center text-gray-600 text-sm">
          Generated from GitHub profile • {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default CvGenerator;