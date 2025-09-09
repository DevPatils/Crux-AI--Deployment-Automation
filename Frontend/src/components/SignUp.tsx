import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <SignUp 
          signInUrl="/signin" 
          afterSignUpUrl="/" 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-xl border-0 rounded-2xl bg-white/90 backdrop-blur-sm",
              headerTitle: "text-xl sm:text-2xl font-bold text-gray-900",
              headerSubtitle: "text-gray-600 text-sm sm:text-base",
              formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300",
              formFieldInput: "rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500",
              footerActionLink: "text-blue-600 hover:text-blue-700"
            }
          }}
        />
      </div>
    </div>
  );
}
