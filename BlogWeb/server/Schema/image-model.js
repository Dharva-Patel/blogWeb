import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema(
    {
        image: String
    },
    {
        collection: "ImageDetails",
    }
);

export default ImageSchema;

mongoose.model('ImageDetails', ImageSchema);