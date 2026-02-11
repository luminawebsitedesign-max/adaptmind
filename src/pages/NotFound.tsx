import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import adaptmindTextLight from "@/assets/adaptmind-text-light.png";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-card to-background p-4">
      <div className="text-center max-w-md">
        <img 
          src={adaptmindTextLight} 
          alt="AdaptMind" 
          className="h-16 mx-auto object-contain mb-8"
        />
        <h1 className="text-7xl font-bold text-primary mb-4">404</h1>
        <p className="text-xl text-foreground font-medium mb-2">Page not found</p>
        <p className="text-sm text-muted-foreground mb-8">
          The page <code className="px-1.5 py-0.5 rounded bg-muted text-xs">{location.pathname}</code> doesn't exist.
        </p>
        <Button 
          onClick={() => navigate("/")} 
          size="lg"
          className="glow-primary"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
