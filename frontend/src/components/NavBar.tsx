// import { useState, useEffect, useRef } from "react";
// import { Link } from "react-router-dom";
// import { useAuth } from "../hooks/useAuth.tsx";
// import ResetPinButton from "@/components/ResetPinButton.tsx";
// import PinManager from "@/components/PinManager.tsx";
// import { Menu, X } from "lucide-react";
// import { Button } from "@/components/ui/button.tsx";

// export default function NavBar() {
//   const { user, logout } = useAuth();
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [modalOpen, setModalOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   // 🔹 Prevent dropdown from closing when modal is open
//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       if (modalOpen) return; // ignore clicks while modal is active
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(event.target as Node)
//       ) {
//         setMenuOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [modalOpen]);

//   return (
//     <header className="bg-purple-800 shadow-sm">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between h-16 items-center">
//           {/* Left */}
//           <div className="flex items-center gap-6">
//             <div className="text-xl font-bold text-white">SecureBank</div>
//             <nav className="hidden md:flex gap-4">
//               <Link to="/" className="text-sm text-white hover:text-purple-200">
//                 Dashboard
//               </Link>
//               {user?.role === "admin" && (
//                 <Link
//                   to="/admin"
//                   className="text-sm text-white hover:text-purple-200"
//                 >
//                   Admin
//                 </Link>
//               )}
//             </nav>
//           </div>

//           {/* Right */}
//           <div className="flex items-center gap-3 relative">
//             {user ? (
//               <>
//                 <div className="text-sm text-white whitespace-nowrap">
//                   Hi, <strong>{user.name}</strong>
//                 </div>

//                 {/* Desktop */}
//                 <div className="hidden md:flex items-center gap-2">
//                   <button
//                     onClick={logout}
//                     className="px-3 py-1 border rounded text-white hover:bg-purple-700 transition cursor-pointer"
//                   >
//                     Sign out
//                   </button>
//                 </div>

//                 {/* Mobile Dropdown */}
//                 <div className="md:hidden relative" ref={dropdownRef}>
//                   <button
//                     onClick={() => setMenuOpen(!menuOpen)}
//                     className="p-2 rounded text-white hover:bg-purple-700 transition cursor-pointer"
//                   >
//                     {menuOpen ? <X size={22} /> : <Menu size={22} />}
//                   </button>

//                   {menuOpen && (
//                     <div
//                       className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-purple-300 py-3 z-50"
//                       onClick={(e) => e.stopPropagation()}
//                     >
//                       <div className="flex flex-col items-center justify-center gap-2">
//                         {/* 🔹 Pass down modal state handler */}
//                         <PinManager
//                           wallet={{
//                             walletNumber: user.walletNumber,
//                             hasPin: user.hasPin ?? false
//                           }}
//                           onModalToggle={setModalOpen}
//                         />

//                         <ResetPinButton
//                           walletNumber={user.walletNumber}
//                           onModalToggle={setModalOpen}
//                         />

//                         <Button
//                           onClick={logout}
//                           variant="outline"
//                           size="sm"
//                           className="min-w-[90px] px-4 py-2 text-sm hover:bg-purple-100 cursor-pointer"
//                         >
//                           Sign Out
//                         </Button>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </>
//             ) : (
//               <Link
//                 to="/login"
//                 className="px-3 py-1 border rounded text-white hover:bg-purple-700 transition"
//               >
//                 Sign in
//               </Link>
//             )}
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// }

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.tsx";
import ResetPinButton from "@/components/ResetPinButton.tsx";
import PinManager from "@/components/PinManager.tsx";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

export default function NavBar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Maintain wallet state to reflect PIN reset or change
  const [walletState, setWalletState] = useState({
    walletNumber: user?.walletNumber ?? "",
    hasPin: user?.hasPin ?? false
  });

  // Sync when user changes
  useEffect(() => {
    if (user) {
      setWalletState({
        walletNumber: user.walletNumber,
        hasPin: user.hasPin ?? false
      });
    }
  }, [user]);

  // 🔹 Prevent dropdown from closing when modal is open
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalOpen) return;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [modalOpen]);

  // When reset complete, update state to "PIN not set"
  const handleResetComplete = () => {
    setWalletState((prev) => ({ ...prev, hasPin: false }));
  };

  return (
    <header className="bg-purple-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left */}
          <div className="flex items-center gap-6">
            <div className="text-xl font-bold text-white">SecureBank</div>
            <nav className="hidden md:flex gap-4">
              <Link to="/" className="text-sm text-white hover:text-purple-200">
                Dashboard
              </Link>
              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  className="text-sm text-white hover:text-purple-200"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3 relative">
            {user ? (
              <>
                <div className="text-sm text-white whitespace-nowrap">
                  Hi, <strong>{user.name}</strong>
                </div>

                {/* Desktop */}
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={logout}
                    className="px-3 py-1 border rounded text-white hover:bg-purple-700 transition cursor-pointer"
                  >
                    Sign out
                  </button>
                </div>

                {/* Mobile Dropdown */}
                <div className="md:hidden relative" ref={dropdownRef}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-2 rounded text-white hover:bg-purple-700 transition cursor-pointer"
                  >
                    {menuOpen ? <X size={22} /> : <Menu size={22} />}
                  </button>

                  {menuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-purple-300 py-3 z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        {/* 🔹 Controlled PinManager */}
                        <PinManager
                          wallet={walletState}
                          onModalToggle={setModalOpen}
                        />

                        {/* 🔹 ResetPinButton tells parent when done */}
                        <ResetPinButton
                          walletNumber={walletState.walletNumber}
                          onResetComplete={handleResetComplete}
                          onModalToggle={setModalOpen}
                        />

                        <Button
                          onClick={logout}
                          variant="outline"
                          size="sm"
                          className="min-w-[90px] px-4 py-2 text-sm hover:bg-purple-100 cursor-pointer"
                        >
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1 border rounded text-white hover:bg-purple-700 transition"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
