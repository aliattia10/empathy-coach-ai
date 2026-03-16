import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <p className="flex flex-col sm:flex-row gap-2 justify-center">
          <a href="/" className="text-primary underline hover:text-primary/90">Main site</a>
          <span className="hidden sm:inline text-muted-foreground">·</span>
          <a href="/testing" className="text-primary underline hover:text-primary/90">Go to Testing</a>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
