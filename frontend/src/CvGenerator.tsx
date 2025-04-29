import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const CvGenerator = () => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tokenFromUrl = queryParams.get('token');
    const userFromUrl = queryParams.get('user');

    if (tokenFromUrl && userFromUrl) {
      setToken(tokenFromUrl);
      setUser(JSON.parse(decodeURIComponent(userFromUrl)));
    }
  }, [location]);

  if (!token || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>CV Generation</h1>
      <p>Name: {user.name}</p>
      <p>Bio: {user.bio}</p>
      {/* You can now use the token to fetch repositories or other GitHub data */}
    </div>
  );
};

export default CvGenerator;