// File: src/pages/UploadMediaPage.jsx
import Backdrop from "../components/Backdrop";
import Card from "../components/Card";
import GoogleDrivePicker from "../components/GoogleDrivePicker";
import { ENV } from "../utils/fromEnv";

export default function UploadMediaPage() {
  const PHOTOS_FOLDER = ENV.DRIVE_PHOTOS;
  const VIDEOS_FOLDER = ENV.DRIVE_VIDEOS;

  return (
    <Backdrop>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Card className="p-6 md:p-8 text-white space-y-6">
          <h1 className="text-3xl font-bold">Upload Wedding Media</h1>
          <p className="text-white/80">
            Please upload your photos and videos. Larger videos may take a moment to
            process on Google Drive before previews work.
          </p>

          <div className="flex gap-3 flex-wrap">
            <GoogleDrivePicker folderId={PHOTOS_FOLDER} label="Upload Photos" />
            <GoogleDrivePicker folderId={VIDEOS_FOLDER} label="Upload Videos" />
          </div>

          {(!PHOTOS_FOLDER || !VIDEOS_FOLDER) && (
            <p className="text-sm text-red-200">
              One or more Drive folder IDs are missing. Check your .env and restart the dev
              server.
            </p>
          )}
        </Card>
      </div>
    </Backdrop>
  );
}
