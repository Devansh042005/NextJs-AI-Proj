// API IN NEXT JS
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import bcrypt from "bcryptjs";

import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";

export async function POST(request: Request) {
  await dbConnect();
  try {
    const { username, email, password } = await request.json();
    const existingUserVerifiedByUsername = await UserModel.findOne({
      username,
      isVerified: true, // username tbi jb verified true ho
    });
    if (existingUserVerifiedByUsername) {
      return Response.json(
        {
          success: false,
          message: "Username is already taken",
        },
        { status: 400 }
      );
    }

    const existingUserByEmail = await UserModel.findOne({ email }); // email se user ko dhund rahe hai
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit verification code
    if (existingUserByEmail) {
      if(existingUserByEmail.isVerified){
        return Response.json(
          {
            success: false,
            message: "Email is already registered and verified",
          },
          { status: 400 }
        );
      } else {
        // if user exists but not verified, update the user with the new details 
        const hasedPassword = await bcrypt.hash(password, 10);
        existingUserByEmail.password = hasedPassword;
        existingUserByEmail.verifyCode = verifyCode;
        existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000); // 1 hour from now
        await existingUserByEmail.save();
      }
    } else { // new user registration
      const hasedPassword = await bcrypt.hash(password, 10); // Hash the password before saving
      const expiryDate = new Date(); // here date is acting as object
      expiryDate.setHours(expiryDate.getHours() + 1); // Set expiry date to 1 hour from now

      const newUser = new UserModel({
        username,
        email,
        password: hasedPassword,
        verifyCode,
        verifyCodeExpiry: expiryDate,
        isVerified: false,
        isAcceptingMessages: true,
        messages: [],
      });
      await newUser.save();
    }
    
    // Send verification email
    const emailResponse = await sendVerificationEmail(
      email,
      username,
      verifyCode
    )
    if(!emailResponse.success){
      return Response.json({
        success: false,
        message: emailResponse.message,
      }, {status: 500});
    }
    return Response.json({
      success: true,
      message: "User registered successfully. Please check your email for verification.",
    }, {status: 201});

  } catch (error) {
    console.error("Error registering user:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to register user.",
      },
      {
        status: 500,
      }
    );
  }
}
