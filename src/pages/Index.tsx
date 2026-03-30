import { AuthCard } from "@/components/AuthCard";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();

  const handleSignIn = (email: string, password: string) => {
    // This will be replaced with Supabase auth once connected
    toast({
      title: "Sign in attempted",
      description: `Email: ${email}`,
    });
    console.log("Sign in with:", { email, password });
  };

  return <AuthCard onSignIn={handleSignIn} />;
};

export default Index;
