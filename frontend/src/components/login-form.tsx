import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import githubLogo from '@/assets/github-mark-white.svg';
import landingImage from '@/assets/cvGenLandingPageImg.png'
interface LoginFormProps extends React.ComponentProps<"div"> {}




export function LoginForm({ className, ...props }: LoginFormProps) {
    // GitHub OAuth URL construction
    const clientId = "Ov23lilojEv110n1W0Bv"; // Replace with your GitHub client ID
    const redirectUri = "https://cvgen-bs2o.onrender.com/auth/github/callback"; // Replace with your backend callback URL
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=https://cvgen-bs2o.onrender.com/auth/github/callback&scope=read:user+public_repo`;
  
    // Redirect to GitHub OAuth when button is clicked
    const handleGitHubAuth = () => {
      window.location.href = githubAuthUrl;
    };
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-lg rounded-lg">
        <CardContent className="grid p-0 md:grid-cols-2">

          <div className="flex flex-col justify-center p-6 md:p-10 lg:p-12">
            <div className="flex flex-col gap-6 text-center md:text-left">
              <div className="flex flex-col items-center md:items-start">
                <h1 className="text-3xl font-bold tracking-tight">Welcome to CVGen</h1>
                <p className="mt-2 text-muted-foreground text-balance max-w-md font-bold">
                  Effortlessly generate a professional CV by connecting your GitHub account. Showcase your projects, contributions, and skills automatically.
                </p>
              </div>

              <Button type="button" size="lg" className="w-full mt-4 shadow-md hover:shadow-lg transition-shadow duration-200" onClick={handleGitHubAuth}>
                <img src={githubLogo} className="mr-2 h-5 w-5" />
                Authenticate with GitHub
              </Button>

              <p className="mt-2 text-xs text-muted-foreground text-center md:text-left font-bold">
                We'll request read-only access to your public repositories and profile information.
              </p>
            </div>
          </div>

          <div className="bg-muted relative hidden md:block">
            <img
              src={landingImage}
              alt="CV Generation Illustration"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.3] dark:grayscale"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = "https://placehold.co/600x800/e2e8f0/475569?text=CVGen+Image";
                target.alt = "Placeholder image for CV Generation Illustration";
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
