import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Gunakan Gmail / SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,  // email pengirim
        pass: process.env.EMAIL_PASS   // app password
      }
    });

    await transporter.sendMail({
      from: `"Contact Form SSR" <${process.env.EMAIL_USER}>`,
      to: "vzzyybot@gmail.com",  // tujuan tetap
      subject: `New Message from ${name}`,
      text: `
        Name: ${name}
        Email: ${email}
        Message: ${message}
      `
    });

    res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send message." });
  }
}
