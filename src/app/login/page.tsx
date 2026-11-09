import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Log in" };

export default function Login({ searchParams }: { searchParams: { next?: string } }) {
  return <AuthForm mode="login" next={searchParams.next} />;
}
