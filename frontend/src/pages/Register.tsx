import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const phoneRegExp = /^(\+?\d{1,4}[\s-]?)?(\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}$/;

interface RegisterInputs {
  name: string;
  phone: string;
  email: string;
  password: string;
}

const schema = yup.object({
  name: yup.string().required("Full name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  phone: yup
    .string()
    .matches(phoneRegExp, "Invalid phone number")
    .required("Phone number is required"),
  password: yup
    .string()
    .min(6, "Minimum 6 characters")
    .required("Password is required")
});

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterInputs>({
    resolver: yupResolver(schema)
  });
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data: RegisterInputs) => {
    try {
      await registerUser(data.name, data.phone, data.email, data.password);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 pt-20 pb-10">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow border border-purple-500">
        <h1 className="mb-6 text-center text-2xl font-semibold text-gray-800">
          Create Account
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="mb-6">
            <label className="block text-sm font-medium">Full Name</label>
            <input
              outline-none
              type="text"
              {...register("name")}
              className="mt-1 w-full outline-none  rounded-md border border-purple-300 p-2 focus:border-purple-500 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.name.message || ""}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Phone Number</label>
            <input
              type="text"
              {...register("phone")}
              className="mt-1 w-full outline-none rounded-md border border-purple-300 p-2 focus:border-purple-500 focus:ring-blue-500"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">
                {errors.phone?.message || ""}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              {...register("email")}
              className="mt-1 w-full outline-none rounded-md border border-purple-300 p-2 focus:border-purple-500 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message || ""}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              {...register("password")}
              className="mt-1 w-full outline-none rounded-md border border-purple-300 p-2 focus:border-purple-500 focus:ring-blue-500"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message || ""}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-purple-600 p-2 text-white hover:bg-purple-700 disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-purple-600 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
