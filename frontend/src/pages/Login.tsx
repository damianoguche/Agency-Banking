import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface LoginInputs {
  email: string;
  password: string;
}

const schema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().required("Password is required")
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginInputs>({
    resolver: yupResolver(schema)
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data: LoginInputs) => {
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Login failed");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 pt-20 pb-10 transition-colors duration-500">
      <motion.div
        key="loginForm"
        initial={{ opacity: 0, y: 40 }}
        animate={{
          opacity: 1,
          y: 0,
          x: shake ? [0, -10, 10, -10, 10, 0] : 0
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full border border-purple-500 max-w-md rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-lg dark:shadow-gray-700/30 transition-colors duration-300"
      >
        <h1 className="mb-6 text-center text-3xl font-bold text-purple-800 dark:text-gray-100">
          Sign In
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* EMAIL FIELD */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <motion.input
              type="email"
              {...register("email")}
              className={`mt-1 outline-none w-full rounded-md border p-2 bg-transparent transition-all duration-200 
                ${
                  errors.email
                    ? "border-red-500 focus:ring-red-400"
                    : "border-purple-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500"
                }`}
              whileFocus={{ scale: 1.02 }}
            />
            <AnimatePresence>
              {errors.email && (
                <motion.p
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  {errors.email.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* PASSWORD FIELD */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <motion.input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className={`mt-1 outline-none w-full rounded-md border p-2 pr-10 bg-transparent transition-all duration-200 
                ${
                  errors.password
                    ? "border-red-500 focus:ring-red-400"
                    : "border-purple-300 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500"
                }`}
              whileFocus={{ scale: 1.02 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <AnimatePresence>
              {errors.password && (
                <motion.p
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  {errors.password.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* SUBMIT BUTTON */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-md bg-purple-600 py-2 text-white font-medium shadow hover:bg-purple-700 transition-colors duration-200 disabled:opacity-60 dark:bg-purple-500 dark:hover:bg-purple-600 cursor-pointer"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-purple-600 dark:text-purple-400 hover:underline"
          >
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
