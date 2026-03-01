import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase/utils";

// Handles password reset requests via Firebase Auth
export const handleResetPasswordAPI = (email) => {
  const config = {
    url: "http://localhost:5173/login", 
  };

  return new Promise((resolve, reject) => {
    sendPasswordResetEmail(auth, email, config)
      .then(() => {
        resolve();
      })
      .catch(() => {
        const error = [
          "No account found with that email. Please try again.",
        ];
        reject(error);
      });
  });
};
