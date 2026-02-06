export function AuthLayout({ children }: React.PropsWithChildren) {
  return (
    <div className="flex justify-center min-h-screen bg-gray-50">
      {/* Auth UI has margin-top on title, so we lower the top padding */}
      <div className="card mt-32 h-fit w-full max-w-md px-8 py-10 pt-4">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src="/unicon-logo.png" alt="Unicon" className="h-12" />
        </div>
        {children}
      </div>
    </div>
  );
}
