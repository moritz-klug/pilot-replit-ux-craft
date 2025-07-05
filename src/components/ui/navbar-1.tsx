"use client" 

import * as React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Menu, X } from "lucide-react"
import { Link } from "react-router-dom"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar"

const Navbar1 = () => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <div className="flex justify-center w-full py-6 px-4">
      <div className="flex items-center justify-between px-6 py-3 bg-white rounded-full shadow-lg w-full max-w-6xl relative z-10">
        <div className="flex items-center">
          <motion.div
            className="flex items-center space-x-2"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/de1b37d7-39b9-4668-81d7-1b1d316fd42d.png" 
                alt="Auto UI" 
                className="w-8 h-8"
              />
              <span className="text-xl font-semibold text-gray-900 hover:text-gray-600 transition-colors">
                Auto UI
              </span>
            </Link>
          </motion.div>
        </div>
        
        {/* Desktop Navigation */}
        <Menubar className="hidden md:flex bg-transparent border-none p-0 space-x-4">
          <MenubarMenu>
            <MenubarTrigger className="text-sm text-gray-900 hover:text-gray-600 transition-colors font-medium bg-transparent px-0">
              Company
            </MenubarTrigger>
            <MenubarContent className="z-50 bg-white border border-gray-200 shadow-lg">
              <MenubarItem asChild>
                <Link to="/about">About Us</Link>
              </MenubarItem>
              <MenubarItem asChild>
                <Link to="/features">Features</Link>
              </MenubarItem>
              <MenubarItem asChild>
                <Link to="/pricing">Pricing</Link>
              </MenubarItem>
              <MenubarItem asChild>
                <Link to="/contact">Contact</Link>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="text-sm text-gray-900 hover:text-gray-600 transition-colors font-medium bg-transparent px-0">
              Tools
            </MenubarTrigger>
            <MenubarContent className="z-50 bg-white border border-gray-200 shadow-lg">
              <MenubarItem asChild>
                <Link to="/feature-review">Feature Review</Link>
              </MenubarItem>
              <MenubarItem asChild>
                <Link to="/recommendations">Recommendations</Link>
              </MenubarItem>
              <MenubarItem asChild>
                <Link to="/screenshot-tool">Screenshot Tool</Link>
              </MenubarItem>
              <MenubarItem asChild>
                <Link to="/results">Results</Link>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>

        {/* Desktop CTA Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <button className="text-sm text-gray-900 hover:text-gray-600 transition-colors font-medium">
              Contact sales
            </button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            whileHover={{ scale: 1.05 }}
          >
            <button className="text-sm text-gray-900 hover:text-gray-600 transition-colors font-medium">
              Log in
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
          >
            <Link
              to="/feature-review"
              className="inline-flex items-center justify-center px-5 py-2 text-sm text-white bg-black rounded-full hover:bg-gray-800 transition-colors font-medium"
            >
              Start analyzing
            </Link>
          </motion.div>
        </div>

        {/* Mobile Menu Button */}
        <motion.button className="md:hidden flex items-center" onClick={toggleMenu} whileTap={{ scale: 0.9 }}>
          <Menu className="h-6 w-6 text-gray-900" />
        </motion.button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-white z-50 pt-24 px-6 md:hidden"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <motion.button
              className="absolute top-6 right-6 p-2"
              onClick={toggleMenu}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <X className="h-6 w-6 text-gray-900" />
            </motion.button>
            <div className="flex flex-col space-y-6">
              {[
                { name: "About Us", path: "/about" },
                { name: "Features", path: "/features" },
                { name: "Pricing", path: "/pricing" },
                { name: "Contact", path: "/contact" },
                { name: "Feature Review", path: "/feature-review" },
                { name: "Recommendations", path: "/recommendations" },
                { name: "Screenshot Tool", path: "/screenshot-tool" },
                { name: "Results", path: "/results" }
              ].map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.1 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Link 
                    to={item.path} 
                    className="text-base text-gray-900 font-medium" 
                    onClick={toggleMenu}
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                exit={{ opacity: 0, y: 20 }}
                className="pt-6 space-y-4"
              >
                <button className="text-base text-gray-900 font-medium w-full text-left">
                  Contact sales
                </button>
                <button className="text-base text-gray-900 font-medium w-full text-left">
                  Log in
                </button>
                <Link
                  to="/feature-review"
                  className="inline-flex items-center justify-center w-full px-5 py-3 text-base text-white bg-black rounded-full hover:bg-gray-800 transition-colors font-medium"
                  onClick={toggleMenu}
                >
                  Start analyzing
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { Navbar1 }