import Link from 'next/link';
import {
  Heart,
  Calendar,
  MessageCircle,
  Shield,
  Star,
  MapPin,
  ChevronRight,
  Smartphone,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream-50">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream-50/80 backdrop-blur-xl border-b border-cream-300/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-sage-400 rounded-xl flex items-center justify-center">
              <span className="text-white font-display text-lg leading-none">C</span>
            </div>
            <span className="font-display text-xl text-sage-800">Chivalry</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-sage-600 hover:text-sage-800 transition-colors px-4 py-2"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm font-medium bg-sage-400 text-white px-5 py-2.5 rounded-xl hover:bg-sage-500 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-20 -right-32 w-96 h-96 bg-sage-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-cream-300 rounded-full blur-3xl opacity-50" />
        
        <div className="max-w-6xl mx-auto relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-sage-100/80 text-sage-600 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Heart className="w-3.5 h-3.5" />
              Now available on Android &amp; Web
            </div>
            
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-sage-800 leading-[1.05] mb-6">
              Putting dates
              <br />
              <span className="text-sage-400">back into dating</span>
            </h1>
            
            <p className="text-lg text-cream-700 leading-relaxed max-w-lg mb-10">
              Tired of endless swiping that leads nowhere? Chivalry is built around real
              dates — propose a plan, agree on the details, and actually meet in person.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 bg-sage-400 text-white font-medium px-8 py-3.5 rounded-2xl hover:bg-sage-500 transition-all hover:shadow-lg hover:shadow-sage-400/20 text-base"
              >
                Start dating for real
                <ChevronRight className="w-4 h-4" />
              </Link>
              <a
                href="https://play.google.com/store/apps/details?id=com.chivalry.date"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-cream-200 text-sage-800 font-medium px-8 py-3.5 rounded-2xl hover:bg-cream-300 transition-all text-base"
              >
                <Smartphone className="w-4 h-4" />
                Get the Android app
              </a>
            </div>
          </div>

          {/* Hero visual — phone mockup placeholder */}
          <div className="hidden lg:block absolute right-0 top-8 w-80">
            <div className="relative">
              <div className="w-72 h-[560px] bg-white rounded-[40px] shadow-2xl shadow-sage-800/10 border border-cream-300 p-3 mx-auto">
                <div className="w-full h-full bg-cream-100 rounded-[32px] flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-sage-400 rounded-2xl flex items-center justify-center mb-4">
                    <span className="text-white font-display text-3xl">C</span>
                  </div>
                  <p className="text-sage-600 font-display text-xl">Chivalry</p>
                  <p className="text-cream-600 text-sm mt-1">Real dates. Real people.</p>
                </div>
              </div>
              {/* Floating notification cards */}
              <div className="absolute -left-16 top-24 bg-white rounded-2xl shadow-xl shadow-sage-800/8 p-4 w-56 border border-cream-200 rotate-[-3deg]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-sage-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-sage-800">Date confirmed!</p>
                    <p className="text-xs text-cream-700">Saturday at 7pm</p>
                  </div>
                </div>
                <p className="text-xs text-cream-600">Coffee at Frothy Monkey</p>
              </div>
              <div className="absolute -right-12 bottom-40 bg-white rounded-2xl shadow-xl shadow-sage-800/8 p-4 w-52 border border-cream-200 rotate-[2deg]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold-400/20 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-gold-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-sage-800">New match!</p>
                    <p className="text-xs text-cream-700">You both liked each other</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl text-sage-800 mb-4">
              Dating the way it should be
            </h2>
            <p className="text-cream-700 max-w-md mx-auto">
              No games, no ghosting, no endless chat. Just real plans with real people.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: 'Discover & match',
                description:
                  'Browse profiles of real people near you. Like someone? If they like you back, you\'re matched and ready to plan a date.',
                accent: 'bg-sage-100 text-sage-400',
              },
              {
                icon: Calendar,
                title: 'Plan a real date',
                description:
                  'No more "hey" that goes nowhere. Propose a date idea, pick a place, agree on a time. It\'s all built into the app.',
                accent: 'bg-gold-400/15 text-gold-600',
              },
              {
                icon: MapPin,
                title: 'Meet in person',
                description:
                  'Show up, have a great time, and rate your date afterwards. The more great dates you have, the better your matches get.',
                accent: 'bg-sage-100 text-sage-600',
              },
            ].map((step, i) => (
              <div
                key={i}
                className="group relative bg-cream-50 rounded-3xl p-8 border border-cream-300/50 hover:border-sage-200 transition-all hover:shadow-lg hover:shadow-sage-100/50"
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${step.accent}`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-cream-600">Step {i + 1}</span>
                </div>
                <h3 className="font-display text-xl text-sage-800 mb-3">{step.title}</h3>
                <p className="text-cream-700 leading-relaxed text-[15px]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6 bg-cream-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl text-sage-800 mb-4">
              Built for people who want more
            </h2>
            <p className="text-cream-700 max-w-md mx-auto">
              Every feature is designed to get you off the app and into the real world.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Calendar,
                title: 'Date planning',
                desc: 'Propose ideas, negotiate times, confirm plans — all within the app.',
              },
              {
                icon: MessageCircle,
                title: 'Real-time chat',
                desc: 'Message your matches to work out the details before the big night.',
              },
              {
                icon: Star,
                title: 'Post-date ratings',
                desc: 'Rate your dates to improve future matches. Only you see your ratings.',
              },
              {
                icon: Shield,
                title: 'Verified profiles',
                desc: 'ID verification so you know you\'re meeting a real person.',
              },
              {
                icon: MapPin,
                title: 'Location-aware',
                desc: 'Find people near you. Set your distance range and discover locals.',
              },
              {
                icon: Heart,
                title: 'Date ideas',
                desc: 'Every profile has date ideas — see what they\'re into before you match.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex gap-4 p-5 rounded-2xl hover:bg-white/60 transition-colors"
              >
                <div className="w-10 h-10 shrink-0 bg-sage-100 rounded-xl flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-sage-400" />
                </div>
                <div>
                  <h3 className="font-medium text-sage-800 mb-1">{feature.title}</h3>
                  <p className="text-sm text-cream-700 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 bg-sage-400 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 bottom-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 border border-white rounded-full" />
          <div className="absolute bottom-10 right-20 w-60 h-60 border border-white rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 border border-white rounded-full" />
        </div>
        <div className="max-w-2xl mx-auto text-center relative">
          <h2 className="font-display text-3xl sm:text-4xl text-white mb-4">
            Your next great date is waiting
          </h2>
          <p className="text-sage-100/90 mb-10 text-lg">
            Join Chivalry today and start meeting people who actually want to go on dates.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 bg-white text-sage-600 font-medium px-8 py-3.5 rounded-2xl hover:bg-cream-100 transition-all text-base"
            >
              Create your profile
              <ChevronRight className="w-4 h-4" />
            </Link>
            <a
              href="https://play.google.com/store/apps/details?id=com.chivalry.date"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-sage-600/40 text-white font-medium px-8 py-3.5 rounded-2xl hover:bg-sage-600/60 transition-all text-base border border-white/20"
            >
              <Smartphone className="w-4 h-4" />
              Google Play
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-6 bg-sage-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-sage-400 rounded-lg flex items-center justify-center">
                  <span className="text-white font-display text-base leading-none">C</span>
                </div>
                <span className="font-display text-lg text-cream-200">Chivalry</span>
              </div>
              <p className="text-sage-400 text-sm max-w-xs">
                Putting dates back into dating. Real plans, real people, real connections.
              </p>
            </div>
            <div className="flex gap-12">
              <div>
                <h4 className="text-cream-300 font-medium text-sm mb-3">Product</h4>
                <div className="flex flex-col gap-2">
                  <Link href="/auth/signup" className="text-sage-400 text-sm hover:text-cream-200 transition-colors">
                    Sign up
                  </Link>
                  <a
                    href="https://play.google.com/store/apps/details?id=com.chivalry.date"
                    className="text-sage-400 text-sm hover:text-cream-200 transition-colors"
                  >
                    Android app
                  </a>
                </div>
              </div>
              <div>
                <h4 className="text-cream-300 font-medium text-sm mb-3">Legal</h4>
                <div className="flex flex-col gap-2">
                  <Link href="/privacy" className="text-sage-400 text-sm hover:text-cream-200 transition-colors">
                    Privacy policy
                  </Link>
                  <Link href="/terms" className="text-sage-400 text-sm hover:text-cream-200 transition-colors">
                    Terms of service
                  </Link>
                  <Link href="/support" className="text-sage-400 text-sm hover:text-cream-200 transition-colors">
                    Support
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-sage-700 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-sage-500 text-sm">
              &copy; {new Date().getFullYear()} Chivalry. All rights reserved.
            </p>
            <p className="text-sage-600 text-xs">
              Made in Nashville, TN
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
