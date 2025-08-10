export default function Footers() {
  return (
    <footer className="w-full bg-gray-50 py-12">
      <div className="w-full px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-full bg-gray-800"></div>
              <span className="text-xl font-semibold text-gray-900">Sphere</span>
            </div>
            <p className="text-gray-600">
              Sphere is a platform that helps you connect with people and share your thoughts.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Company</h4>
            <ul className="text-gray-600">
              <li className="mb-2">
                <a href="#" className="hover:text-gray-800">
                  About Us
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="hover:text-gray-800">
                  Careers
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="hover:text-gray-800">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Resources</h4>
            <ul className="text-gray-600">
              <li className="mb-2">
                <a href="#" className="hover:text-gray-800">
                  Blog
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="hover:text-gray-800">
                  Help Center
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="hover:text-gray-800">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Connect</h4>
            <ul className="text-gray-600">
              <li className="mb-2">
                <a href="#" className="hover:text-gray-800">
                  Facebook
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="hover:text-gray-800">
                  Twitter
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="hover:text-gray-800">
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Sphere. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
