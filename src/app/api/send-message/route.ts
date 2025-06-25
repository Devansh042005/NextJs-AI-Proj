import UserModel from "@/models/User";
import dbConnect from "@/lib/dbConnect";
import {Message} from "@/models/User";

export async function POST(request: Request){
    await dbConnect();

    const {username, content} = await request.json()
    try {
        const user = await UserModel.findOne({username})
        if(!user){
            return Response.json(
                {
                    success: false,
                    message: "User not found",
                },
                {status: 404}
            );
        }
        // is user accepting messages?
        if(!user.isAcceptingMessages){
            return Response.json(
                {
                    success: false,
                    message: "User is not accepting messages",
                },
                {status: 403}
            );
        }
        // create a new message
        const newMessage = {content, createdAt: new Date()}
        user.message.push(newMessage as Message);
        await user.save();
        return Response.json(
            {
                success: true,
                message: "Message sent successfully",
                newMessage
            },
            {status: 200}
        );
    } catch (error) {
        console.error("error adding message", error);
        return Response.json(
            {
                success: false,
                message: "internal server error while sending message",
            },
            {status: 500}
        );
    }
}
