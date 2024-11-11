import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { to, subject, html } = await req.json();

  const transporter = nodemailer.createTransport({
    host: process.env.NEXT_SMTP_HOST,
    port: process.env.NEXT_SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.NEXT_SMTP_USER,
      pass: process.env.NEXT_SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.NEXT_SMTP_USER,
      to,
      subject,
      html
    });
    return NextResponse.json({ message: 'HTML email sent successfully' });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
