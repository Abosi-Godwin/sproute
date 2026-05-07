import { useState } from "react";
import { Menu, X } from "lucide-react";

 function Navbar() {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    return (
        <nav className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                        sproute
                    </span>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 md:hidden"
                        aria-label="Toggle menu"
                    >
                        {isOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>
        </nav>
    );
}
export default Navbar
  