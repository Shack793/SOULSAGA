import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Join" };

export default function Register({ searchParams }: { searchParams: { next?: string } }) {
  return <AuthForm mode="register" next={searchParams.next} />;
}
