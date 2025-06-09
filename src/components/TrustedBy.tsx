
const TrustedBy = () => {
  const companies = [
    { name: "Google", logo: "🔍" },
    { name: "Microsoft", logo: "🪟" },
    { name: "Apple", logo: "🍎" },
    { name: "Meta", logo: "📘" },
    { name: "Amazon", logo: "📦" }
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-8">
            Trusted by teams at leading companies
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {companies.map((company, index) => (
              <div key={index} className="flex items-center space-x-3 opacity-60 hover:opacity-100 transition-opacity">
                <span className="text-2xl">{company.logo}</span>
                <span className="text-lg font-medium text-muted-foreground">{company.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;
