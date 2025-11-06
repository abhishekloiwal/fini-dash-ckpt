import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "See how Fini connects to your CX stack, curates knowledge, and delivers traceable AI simulations before launch.",
};

const HowItWorksPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-white text-slate-900">
      <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-16 font-sans lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-10 shadow-sm backdrop-blur">
          <div className="space-y-4">
            <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-600">
              Quick tour of the Fini workflow
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              Connect. Test. Trust.
            </h1>
            <p className="text-sm text-slate-600 md:text-base">
              Connect your Zendesk and customer support content — PDFs, Docs, links, FAQs, and more.
              Fini instantly builds a smart knowledge base from your conversations and files, giving you
              everything you need to see it in action:
            </p>
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800 md:text-base">
              <a
                href="#chat-widget"
                className="transition hover:text-sky-600 focus:text-sky-600 focus:outline-none"
              >
                Chat Widget
              </a>
              <span>·</span>
              <a
                href="#help-center"
                className="transition hover:text-sky-600 focus:text-sky-600 focus:outline-none"
              >
                Help Center
              </a>
              <span>·</span>
              <a
                href="#simulations"
                className="transition hover:text-sky-600 focus:text-sky-600 focus:outline-none"
              >
                Simulations
              </a>
            </p>
          </div>
        </section>

        <section
          id="chat-widget"
          className="grid gap-6 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm backdrop-blur lg:grid-cols-[1.2fr,1fr] lg:items-center"
        >
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">Chat with Your Widget 💬</h2>
            <p className="text-sm text-slate-600">
              Your company gets its own live Fini widget. Ask it real customer questions, test flows,
              or explore your help content in seconds. No setup, no waiting, it just works.
            </p>
            <a
              href="https://app.usefini.com/widgets/6L52uTX2Xa?mode=widget"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-sky-600 hover:text-sky-500"
            >
              (Widget preview)
            </a>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 shadow-inner">
            <video
              className="h-full w-full rounded-xl border border-slate-200 object-cover"
              autoPlay
              loop
              muted
              playsInline
              controls
            >
              <source src="/ChatbotZinc.mov" type="video/quicktime" />
              <source src="/ChatbotZinc.mov" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </section>

        <section
          id="help-center"
          className="grid gap-6 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm backdrop-blur lg:grid-cols-[1.2fr,1fr] lg:items-center"
        >
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">Explore Your Help Center 🗂️</h2>
            <p className="text-sm text-slate-600">
              Fini launches a tailored help center for you and keeps it refreshed as your knowledge
              base and conversations evolve. Add or approve updates with a human in the loop so every
              customer gets the latest answer.
            </p>
            <a
              href="https://hc.usefini.com/hc/e5tbmp59or"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-sky-600 hover:text-sky-500"
            >
              (Help center preview)
            </a>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 shadow-inner">
            <video
              className="h-full w-full rounded-xl border border-slate-200 object-cover"
              autoPlay
              loop
              muted
              playsInline
              controls
            >
              <source src="/Helpcenter.mov" type="video/quicktime" />
              <source src="/Helpcenter.mov" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </section>

        <section
          id="simulations"
          className="grid gap-6 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm backdrop-blur lg:grid-cols-[1.2fr,1fr] lg:items-center"
        >
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">Run Simulations & Trace Results 📊</h2>
            <p className="text-sm text-slate-600">
              Simulate real conversations, measure performance, and trace every decision — full transparency
              before you go live.
            </p>
            <Link href="/" className="text-xs font-semibold text-sky-600 hover:text-sky-500">
              (Simulation report preview)
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 shadow-inner">
            <video
              className="h-full w-full rounded-xl border border-slate-200 object-cover"
              autoPlay
              loop
              muted
              playsInline
              controls
            >
              <source src="/Report.mov" type="video/quicktime" />
              <source src="/Report.mov" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-10 text-center shadow-sm backdrop-blur">
          <p className="text-sm text-slate-600">
            Ready to see it live? Connect with our team or email{" "}
            <a href="mailto:connect@usefini.com" className="font-semibold text-sky-600 hover:text-sky-500">
              connect@usefini.com
            </a>{" "}
            and we’ll get you fully set up in under 15 minutes.
          </p>
        </section>
      </main>
    </div>
  );
};

export default HowItWorksPage;
