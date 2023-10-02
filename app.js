const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const multer = require("multer");
const shortid = require("shortid");
const fs = require("fs-extra");
const { exec } = require('child_process');
const path = require("path");
const { SpeechClient } = require("@google-cloud/speech");

const app = express();
const port = 5000;

// Configure multer to store uploaded files
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(express.json());

// Define a route for video transcription
app.post("/api/transcribe", upload.single("video"), async (req, res) => {
  try {
    // Generate a unique identifier for the video
    const videoId = shortid.generate();

    // Define the relative path to the "Downloads" folder
    const downloadsPath = path.join(__dirname, "downloads");

    // Create the "downloads" folder if it doesn't exist
    fs.ensureDirSync(downloadsPath);

    // Save the uploaded video to the "Downloads" folder
    const videoPath = path.join(downloadsPath, `${videoId}.webm`);
    fs.writeFileSync(videoPath, req.file.buffer);

    // Extract audio from the video using ffmpeg
    const audioPath = path.join(downloadsPath, `${videoId}.wav`);
    exec(
      `ffmpeg -i ${videoPath} -vn -acodec pcm_s16le -ar 16000 -ac 1 ${audioPath}`,
      (error) => {
        if (error) {
          console.error("Error extracting audio:", error);
          res.status(500).json({ message: "Error extracting audio" });
        } else {
          // Perform transcription using pocketsphinx
          const command = `pocketsphinx_continuous -infile ${audioPath} -hmm /path/to/acoustic/model -lm /path/to/language/model -dict /path/to/dictionary/file`;
          exec(command, (transcriptionError, stdout) => {
            if (transcriptionError) {
              console.error("Error transcribing audio:", transcriptionError);
              res.status(500).json({ message: "Error transcribing audio" });
            } else {
              // Extract the transcription from stdout
              const transcription = stdout.trim();
              res.json({ videoId, transcription });
            }
          });
        }
      }
    );
  } catch (error) {
    console.error("Error processing video:", error);
    res.status(500).json({ message: "Error processing video" });
  }
});

// Define a route to handle video uploads
app.post("/api/upload", upload.single("video"), async (req, res) => {
  try {
    // Generate a unique identifier for the video
    const videoId = shortid.generate();

    // Define the relative path to the "Downloads" folder
    const downloadsPath = path.join(__dirname, "downloads");

    // Create the "downloads" folder if it doesn't exist
    fs.ensureDirSync(downloadsPath);

    // Save the uploaded video to the "Downloads" folder
    const videoPath = path.join(downloadsPath, `${videoId}.webm`);
    fs.writeFileSync(videoPath, req.file.buffer);

    // Return the path to the uploaded video
    res.json({ videoId });
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ message: "Error uploading video" });
  }
});

// Define a route to serve video files
app.get("/api/videos/:videoId", (req, res) => {
  try {
    // Get the video ID from the request parameters
    const { videoId } = req.params;

    // Define the path to the requested video
    const videoPath = path.join(__dirname, "downloads", `${videoId}.webm`);

    // Check if the video file exists
    if (fs.existsSync(videoPath)) {
      // Set the appropriate content type in the response headers
      res.setHeader("Content-Type", "video/webm");

      // Stream the video file to the response
      const fileStream = fs.createReadStream(videoPath);
      fileStream.pipe(res);
    } else {
      // If the file doesn't exist, return a 404 error
      res.status(404).json({ message: "Video not found" });
    }
  } catch (error) {
    console.error("Error serving video:", error);
    res.status(500).json({ message: "Error serving video" });
  }
});

app.get("/api/videos", (req, res) => {
  try {
    // Define the path to the "Downloads" folder
    const downloadsPath = path.join(__dirname, "downloads");

    // Read the contents of the "Downloads" folder
    const videoFiles = fs.readdirSync(downloadsPath);

    // Filter out non-video files (if any)
    const videoList = videoFiles.filter((file) => file.endsWith(".webm"));

    // Send the list of video filenames as an array
    res.json(videoList);
  } catch (error) {
    console.error("Error fetching video list:", error);
    res.status(500).json({ message: "Error fetching video list" });
  }
});

class Whisper {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.openai.com/v1/audio";
  }

  async transcribe(filePath, modelName) {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));
    formData.append("model", modelName);

    try {
      const response = await axios.post(
        `${this.baseUrl}/transcriptions`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
          },
        }
      );

      return response.data.text;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }

  async translate(filePath, modelName, targetLanguage) {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));
    formData.append("model", modelName);
    formData.append("target_language", targetLanguage);

    try {
      const response = await axios.post(
        `${this.baseUrl}/translations`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
          },
        }
      );

      return response.data.text;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }
}

module.exports = Whisper;

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });
