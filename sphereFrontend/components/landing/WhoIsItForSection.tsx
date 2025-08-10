export default function WhoIsItForSection() {
  return (
    <section className="py-20 w-full">
      <div className="w-full px-4 max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900">For the Investor With Ideas</h2>
          <p className="mt-6 text-lg text-gray-600">
            Sphere is designed for students, professionals, and curious traders who want to move beyond passive
            investing and basic charting. If you follow the markets, have unique insights, and want a systematic way to
            act on them without coding, Sphere is your platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
            <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-800"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-4">Retail Investors</h3>
            <p className="text-gray-600">
              Ambitious traders who want institutional-grade tools without the complexity of coding or expensive
              platforms.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
            <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-800"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-4">Students & Learners</h3>
            <p className="text-gray-600">
              Finance and economics students who want to test theories and learn by doing, without the barrier of
              complex programming.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
            <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-800"
              >
                <rect width="16" height="20" x="4" y="2" rx="2" />
                <path d="M9 22v-4h6v4" />
                <path d="M8 6h.01" />
                <path d="M16 6h.01" />
                <path d="M12 6h.01" />
                <path d="M8 10h.01" />
                <path d="M16 10h.01" />
                <path d="M12 10h.01" />
                <path d="M8 14h.01" />
                <path d="M16 14h.01" />
                <path d="M12 14h.01" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-4">Data-Driven Professionals</h3>
            <p className="text-gray-600">
              Professionals who understand markets but lack the time or technical skills to implement their insights
              systematically.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
