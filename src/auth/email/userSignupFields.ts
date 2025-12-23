import { defineUserSignupFields } from "wasp/server/auth";

export const userSignupFields = defineUserSignupFields({
  email: (data) => {
    if (typeof data.email !== "string") {
      throw new Error("Email is required.");
    }
    if (!data.email.includes("@")) {
      throw new Error("Please enter a valid email address.");
    }
    return data.email;
  },
  fullName: (data) => {
    if (typeof data.fullName !== "string") {
      throw new Error("Full name is required.");
    }
    if (data.fullName.length < 2) {
      throw new Error("Full name must be at least 2 characters long.");
    }
    return data.fullName;
  },
});
