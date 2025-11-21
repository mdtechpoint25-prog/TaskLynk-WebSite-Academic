"use client";

import { useState } from "react";

export const SupportWidget = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Contact Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          aria-label="Open support contact form"
          onClick={() => setOpen(true)}
          className="bg-[var(--primary)] text-white p-4 rounded-full shadow-lg hover:bg-[var(--secondary)] hover:text-black transition-all duration-300"
        >
          <span className="text-xl" role="img" aria-hidden>
            💬
          </span>
        </button>
      </div>

      {/* Popup Contact Form */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          aria-modal="true"
          role="dialog"
        >
          <div className="bg-white dark:bg-[var(--card)] rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              aria-label="Close support contact form"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              ✖
            </button>
            <h3 className="text-xl font-semibold mb-4 text-[var(--primary)]">Contact Support</h3>
            <form
              action="mailto:support@tasklynk.co.ke,tasklynk01@gmail.com"
              method="post"
              encType="text/plain"
              className="space-y-4"
            >
              <input
                type="text"
                name="name"
                placeholder="Full Name *"
                required
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
              <input
                type="email"
                name="email"
                placeholder="Email Address *"
                required
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number *"
                required
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
              <textarea
                name="message"
                placeholder="Message *"
                required
                rows={4}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
              <button type="submit" className="btn btn-primary w-full uppercase">Send Message</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SupportWidget;
