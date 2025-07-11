import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import { User } from "next-auth";
import mongoose from "mongoose";


export async function GET(request: Request){
    await dbConnect();
    const session = await getServerSession(authOptions);
  const user: User = session?.user;

  if (!session || !session.user) {
    return Response.json(
      {
        success: false,
        message: "Not authenticated",
      },
      { status: 401 }
    );
  }
// aggregation pipeline to get messages
  const userId = new mongoose.Types.ObjectId(user._id);
  try {
    const user = await UserModel.aggregate([
        { $match: { _id: userId } },
        {$unwind: "$messages" },
        {$sort: {"messages.createdAt": -1 } },
        {$group: {_id: '$_id' , messages: { $push: "$messages"} } },
    ])
    if(!user || user.length === 0){
        return Response.json(
            {
            success: false,
            message: "No messages found",
            },
            { status: 404 }
        );
    }
    return Response.json(
      {
        success: true,
        messages: user[0].messages, // return the messages array (first object 0 index)
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error occured", error);
    return Response.json(
      {
        success: false,
        message: "Failed to get messages",
      },
      { status: 500 }
    );
  }
}