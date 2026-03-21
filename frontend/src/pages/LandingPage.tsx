import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="text-xl font-bold text-white">Lotus</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/auth/login"
            className="text-gray-400 hover:text-white transition-colors font-medium"
          >
            Login
          </Link>
          <Link
            to="/auth/register"
            className="px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-8 pt-24 pb-20 text-center overflow-hidden">
        {/* Background gradient blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/80 border border-gray-700 rounded-full text-sm text-gray-300 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            AI-Powered English Conversations
          </div>

          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Master English Through{' '}
            <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              Immersive Conversation
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Practice real-world English conversations with AI characters that have unique
            personalities, biases, and communication styles. Get live performance feedback
            and personalized coaching after every session.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth/register"
              className="px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-semibold text-lg transition-all hover:scale-105 shadow-lg shadow-primary-600/30"
            >
              Start Practicing Free
            </Link>
            <Link
              to="/auth/login"
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-2xl font-semibold text-lg transition-all border border-gray-700"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Hero visual: chat preview */}
        <div className="relative max-w-3xl mx-auto mt-16">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-gray-400 text-sm">Active Session — Climate Policy Debate</span>
            </div>
            <div className="space-y-3 text-left">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-accent-600 flex items-center justify-center text-sm font-bold shrink-0">P</div>
                <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
                  <p className="text-xs text-accent-400 mb-1 font-medium">Professor Chen</p>
                  <p className="text-sm text-gray-200">The data clearly shows renewable energy investment yields long-term economic benefits. What's your position?</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <div className="bg-primary-600 rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs">
                  <p className="text-sm text-white">I believe we need a balanced approach that considers both environmental impact and economic feasibility...</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold shrink-0">Y</div>
              </div>
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-green-700 flex items-center justify-center text-sm font-bold shrink-0">M</div>
                <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
                  <p className="text-xs text-green-400 mb-1 font-medium">Minister Davies</p>
                  <p className="text-sm text-gray-200">That's a thoughtful point. However, the transition timeline also matters significantly.</p>
                </div>
              </div>
            </div>
            {/* Live scores strip */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-700">
              <span className="text-xs text-gray-500">Live Scores</span>
              {[
                { label: 'Tone', value: 78, color: '#a78bfa' },
                { label: 'Content', value: 85, color: '#34d399' },
                { label: 'First Voice', value: 62, color: '#60a5fa' },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{s.label}</span>
                  <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${s.value}%`, backgroundColor: s.color }}
                    />
                  </div>
                  <span className="text-xs font-bold" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-8 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Everything you need to level up</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Designed for serious English learners who want measurable progress through realistic practice.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon="🎭"
            title="Real-time AI Characters"
            description="Interact with multi-dimensional AI personas — professors, executives, journalists — each with unique speech patterns, knowledge domains, and conversational biases."
            color="from-accent-500 to-purple-700"
          />
          <FeatureCard
            icon="📊"
            title="Live Performance Tracking"
            description="Three live score dimensions — Tone, Content Depth, and First Voice initiative — update in real-time as you speak, giving you instant awareness of your performance."
            color="from-primary-500 to-cyan-600"
          />
          <FeatureCard
            icon="🎓"
            title="Personalized Debrief"
            description="After every session receive a detailed coaching report with conversation highlights, vocabulary analysis, and an AI coach narrative tailored to your specific growth areas."
            color="from-green-500 to-emerald-700"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-8">
          <FeatureCard
            icon="🌐"
            title="Rich Topic Library"
            description="Explore diverse conversation worlds: from medical consultations to business negotiations, climate debates to historical discussions — each with authentic background knowledge."
            color="from-orange-500 to-red-600"
          />
          <FeatureCard
            icon="🎙️"
            title="Voice-Native Design"
            description="Speak naturally and be heard. Our real-time audio pipeline processes your voice instantly, enabling fluid conversations without awkward delays."
            color="from-pink-500 to-rose-600"
          />
          <FeatureCard
            icon="📈"
            title="CEFR Progress Tracking"
            description="Track your English level progression across sessions. Our calibration system aligns your performance to the Common European Framework of Reference."
            color="from-yellow-500 to-amber-600"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-8 py-20 text-center">
        <div className="max-w-2xl mx-auto bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to find your voice?</h2>
          <p className="text-gray-400 mb-8">
            Join learners who are building real conversational confidence through immersive AI practice.
          </p>
          <Link
            to="/auth/register"
            className="inline-block px-10 py-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white rounded-2xl font-semibold text-lg transition-all hover:scale-105 shadow-lg"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-8 py-8 flex items-center justify-between text-gray-500 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <span className="text-white font-bold text-xs">L</span>
          </div>
          <span className="font-medium text-gray-400">Lotus</span>
        </div>
        <p>Built for language learners everywhere</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: string;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-600 transition-colors">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl mb-4`}>
        {icon}
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
