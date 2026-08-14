import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, Zap, ShieldCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Shell } from "@/components/layout/Shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us - MailReply AI" },
      { name: "description", content: "Learn more about MailReply AI, our vision, and how we are building the future of email assistance." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <Shell>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <article className="prose prose-slate prose-headings:font-display prose-headings:font-semibold prose-a:text-primary dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold tracking-tight mb-2">About MailReply AI</h1>
          <p className="text-xl text-muted-foreground mb-12">Smarter Email Replies, Without the Copy-Paste</p>

          <p>
            MailReply AI is an AI-powered Gmail reply assistant built to make everyday email communication faster, easier, and more consistent.
          </p>
          <p>
            Instead of repeatedly reading long conversations, copying email content into an AI tool, writing prompts, generating a response, and copying it back into Gmail, MailReply AI brings the assistance directly into your email workflow.
          </p>
          <p>
            Open a Gmail conversation, click AI Reply, and let MailReply AI understand the context and create a relevant reply draft.
          </p>

          <div className="my-12 p-8 bg-surface rounded-2xl border border-border/50 shadow-sm">
            <h2 className="text-2xl mt-0 mb-4 flex items-center gap-2">
              <Sparkles className="size-6 text-primary" />
              Built for Real Email Conversations
            </h2>
            <p className="mt-0">
              Email replies are rarely based on a single message. A conversation can contain multiple questions, previous commitments, follow-ups, deadlines, clarifications, and decisions. MailReply AI is designed to consider the relevant conversation context rather than treating the latest email as an isolated message.
            </p>
            <p>It helps identify:</p>
            <ul className="mb-0">
              <li>What the sender is asking</li>
              <li>What has already been discussed</li>
              <li>Previous responses and commitments</li>
              <li>Important questions and action items</li>
              <li>The appropriate tone and level of detail</li>
              <li>What should be addressed in the next reply</li>
            </ul>
            <p className="font-medium mt-4 mb-0 text-foreground">
              The goal is simple: generate a reply that makes sense in the context of the entire conversation.
            </p>
          </div>

          <h2 className="text-3xl mt-12 mb-4">Why We Built MailReply AI</h2>
          <p>MailReply AI was created from a practical need within email-driven workflows.</p>
          <p>
            Teams often spend a significant amount of time switching between Gmail and AI tools, copying conversations, writing prompts, generating responses, and pasting the results back into email.
            This repetitive process slows communication and creates unnecessary work.
          </p>
          <p>MailReply AI brings these steps together:</p>
          <div className="flex flex-wrap items-center gap-2 font-medium text-primary my-6 bg-primary/5 p-4 rounded-lg">
            <span>Read</span>
            <ArrowLeft className="size-4 rotate-180" />
            <span>Understand</span>
            <ArrowLeft className="size-4 rotate-180" />
            <span>Generate</span>
            <ArrowLeft className="size-4 rotate-180" />
            <span>Review</span>
            <ArrowLeft className="size-4 rotate-180" />
            <span>Reply</span>
          </div>
          <p>Everything happens closer to where the work is already being done.</p>

          <h2 className="text-3xl mt-12 mb-4">How It Works</h2>
          <ol className="space-y-4">
            <li><strong>1. Open a Gmail Conversation</strong><br />Open the email thread you want to respond to.</li>
            <li><strong>2. Click AI Reply</strong><br />MailReply AI detects the relevant conversation and prepares the available context.</li>
            <li><strong>3. Add Instructions</strong><br />Tell the AI how you want the response written. For example: <em>"Keep it short and professionally confirm that we can deliver the update by Friday."</em> You can also choose preferences such as tone, length, and language.</li>
            <li><strong>4. Generate the Reply</strong><br />MailReply AI analyzes the conversation and creates a contextual reply draft.</li>
            <li><strong>5. Review and Edit</strong><br />Read the generated response, make any changes you want, and ensure it accurately represents what you want to communicate.</li>
            <li><strong>6. Insert Into Gmail</strong><br />Insert the approved draft into the Gmail reply composer and send it yourself.</li>
          </ol>
          <p className="font-medium">MailReply AI does not automatically send your email. You stay in control of the final message.</p>

          <h2 className="text-3xl mt-12 mb-4">Designed for Busy Teams</h2>
          <p>MailReply AI can be particularly useful for teams that handle a high volume of email communication, including:</p>
          <ul className="space-y-2">
            <li><strong>Lead Generation:</strong> Respond to prospects and follow-ups faster without repeatedly copying conversations into external AI tools.</li>
            <li><strong>Sales Teams:</strong> Create concise, professional responses while preserving the context of ongoing conversations.</li>
            <li><strong>Customer Support:</strong> Handle repetitive email communication more efficiently while maintaining appropriate context and tone.</li>
            <li><strong>Marketing & Operations:</strong> Reduce time spent drafting routine business communication.</li>
            <li><strong>Professionals & Freelancers:</strong> Spend less time writing repetitive replies and more time focusing on meaningful work.</li>
          </ul>

          <h2 className="text-3xl mt-12 mb-4">Personalize Every Reply</h2>
          <p>Every conversation is different, and every user has a different communication style. That's why MailReply AI supports custom instructions.</p>
          <p>You can tell the assistant:</p>
          <ul>
            <li>"Make it friendly and concise."</li>
            <li>"Apologize for the delay and ask for the updated document."</li>
            <li>"Make this more formal."</li>
            <li>"Reply as a senior SEO consultant."</li>
            <li>"Do not mention pricing."</li>
          </ul>
          <p>The AI uses your instructions together with the conversation context to create a more relevant response.</p>

          <div className="grid md:grid-cols-2 gap-6 my-12 not-prose">
            <div className="bg-surface p-6 rounded-2xl border border-border/50">
              <ShieldCheck className="size-8 text-primary mb-4" />
              <h3 className="text-lg font-bold mb-2">Built With User Control in Mind</h3>
              <p className="text-muted-foreground text-sm">
                AI should assist your workflow, not take control of it. You decide whether to use AI, what instructions to provide, which reply to generate, what changes to make, and whether the final message is sent. The final email remains under your control.
              </p>
            </div>
            <div className="bg-surface p-6 rounded-2xl border border-border/50">
              <Zap className="size-8 text-primary mb-4" />
              <h3 className="text-lg font-bold mb-2">Built for Gmail</h3>
              <p className="text-muted-foreground text-sm">
                MailReply AI is designed specifically around the Gmail experience. Rather than forcing users into a separate dashboard, the assistant is intended to work alongside the Gmail workflow you already use every day.
              </p>
            </div>
          </div>

          <h2 className="text-3xl mt-12 mb-4">Privacy Comes First</h2>
          <p>Email conversations can contain highly sensitive information. MailReply AI is designed with data minimization and user control in mind. Gmail access is requested through Google's authorization system, and the information used for reply generation is intended only to provide the requested functionality.</p>
          <p>Depending on your selected AI provider, processing may occur through a cloud-based AI service or a locally configured AI system. We do not design MailReply AI around advertising-based use of Gmail content.</p>
          <p>For complete information about data handling, Gmail permissions, AI processing, retention, and security, please read our <Link to="/privacy-policy">Privacy Policy</Link>.</p>

          <h2 className="text-3xl mt-12 mb-4">Our Vision</h2>
          <p>We believe AI should remove repetitive work without removing human control.</p>
          <p>Email is still one of the most important tools for business communication, but writing thoughtful responses can take unnecessary time when every message requires the same manual process.</p>
          <p>Our vision for MailReply AI is to make email assistance feel natural:</p>
          <ul>
            <li>Open the conversation.</li>
            <li>Understand the context.</li>
            <li>Get a useful draft.</li>
            <li>Make it yours.</li>
            <li>Send it when you're ready.</li>
          </ul>

          <h2 className="text-3xl mt-12 mb-4">The Future of Email Assistance</h2>
          <p>MailReply AI is being designed as more than a simple reply generator. Future capabilities may include smarter follow-up assistance, improved personalization, additional productivity workflows, broader email-platform support, and more advanced contextual assistance.</p>
          <p className="font-medium text-lg">The focus will remain the same: Less repetitive work. Better email communication. More time for meaningful work.</p>

          <div className="my-16 text-center bg-primary/5 rounded-3xl p-10 border border-primary/10">
            <h3 className="text-2xl font-bold mb-2 mt-0">Your conversations have context.<br />Your AI replies should too.</h3>
            <p className="text-muted-foreground mb-8">Understand the conversation. Generate the reply. Keep control.</p>
            <div className="flex flex-wrap items-center justify-center gap-4 not-prose">
              <Button asChild size="lg" className="rounded-full shadow-lg">
                <Link to="/">Try MailReply AI</Link>
              </Button>
            </div>
          </div>

          <h2 className="text-2xl mt-12 mb-4">Contact</h2>
          <p>Have questions, feedback, or ideas for MailReply AI? We would love to hear from you.</p>
          <div className="bg-muted/30 p-4 rounded-lg mt-4 mb-8 text-sm">
            <p className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" /> <strong>Email:</strong> <a href="mailto:anilkumar.apexweb.cube@gmail.com">anilkumar.apexweb.cube@gmail.com</a></p>
            <p className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" /> <strong>Privacy:</strong> <a href="mailto:anilkumar.apexweb.cube@gmail.com">anilkumar.apexweb.cube@gmail.com</a></p>
            <p><strong>Website:</strong> <a href="https://mailreplyai.vercel.app">https://mailreplyai.vercel.app</a></p>
          </div>
        </article>
      </main>
    </Shell>
  );
}
