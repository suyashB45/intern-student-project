"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { motion } from "framer-motion"
import {
    Sparkles,
    Swords,
    UserCog,
    DollarSign, Users, ShoppingCart, GraduationCap, AlertTriangle, Check
} from "lucide-react"
import Navigation from "../components/landing/Navigation"
import { getApiUrl } from "../lib/api"
import { supabase } from "../lib/supabase"

const ICON_MAP: any = {
    Users, ShoppingCart, GraduationCap, AlertTriangle, DollarSign, UserCog
}

const DEFAULT_SCENARIOS = [
    {
        name: "Skill Assessment & Practice",
        color: "from-orange-600 to-red-500",
        scenarios: [
            {
                title: "Scenario 1: Retail Coaching",
                description: "A staff member's recent performance has dropped (sales, energy, engagement). You are the staff member receiving coaching from the manager.",
                ai_role: "Retail Store Manager",
                user_role: "Retail Sales Associate",
                scenario: "CONTEXT: A staff member's recent performance has dropped (sales, energy, engagement). You (the AI) are the Retail Store Manager initiating a coaching conversation. \n\nFOCUS AREAS: Root cause analysis, empathy, and active listening. \n\nAI BEHAVIOR: You are the Retail Store Manager. The user is your staff member. You feel the staff member is burnt out. Start the conversation with empathy but be firm about the performance performance issues. Ask open questions to find the root cause.",
                icon: "Users",
                output_type: "scored_report",
                mode: "evaluation",
                scenario_type: "coaching"
            },
            {
                title: "Scenario 2: Sales and Negotiation",
                description: "A customer is interested in a high-value item but is hesitant about the price. You need to build rapport, discover their actual needs, and articulate value before offering any discounts.",
                ai_role: "Retail Customer",
                user_role: "Salesperson",
                scenario: "CONTEXT: Sales and negotiation coaching for retail staff. \n\nFOCUS AREAS: Developing deeper need-based questioning and delaying price discounting until value is established. \n\nAI BEHAVIOR: Be a customer interested in a high-value item but hesitant about price. Push for a discount early. Only agree if the salesperson builds rapport, discovers your actual needs, and articulates value first.",
                icon: "ShoppingCart",
                output_type: "scored_report",
                mode: "evaluation",
                scenario_type: "negotiation"
            },
            {
                title: "Scenario 3: Skill Development & Learning",
                description: "You are the retail staff member receiving coaching from 'Coach Alex'. The goal is to reflect on a recent interaction, identify where you missed opportunities to ask questions, and practice better responses.",
                ai_role: "Coach Alex",
                user_role: "Retail Staff",
                scenario: "CONTEXT: AI coach developing employee skills. \n\nFOCUS AREAS: Transitioning from feature-focused explanations to needs exploration and implementing conversational pauses. \n\nAI BEHAVIOR: Do NOT judge or score. Act as a supportive coach helping the user reflect on a recent interaction. Guide them to realize they need to ask more questions and pause more often.",
                icon: "GraduationCap",
                output_type: "learning_plan",
                mode: "coaching",
                scenario_type: "reflection"
            }
        ]
    },
    {
        name: "Expert Mentorship",
        color: "from-blue-600 to-cyan-500",
        scenarios: [
            {
                title: "Mentorship: Retail Coaching (Expert Demo)",
                description: "Learn by watching an expert Manager coach a struggling employee. You play the Manager, the AI plays the struggling Employee.",
                ai_role: "Retail Sales Associate",
                user_role: "Retail Store Manager",
                scenario: "CONTEXT: MENTORSHIP SESSION. The user plays the Manager. The AI plays the 'Struggling Employee'. \n\nAI BEHAVIOR: You are the Struggling Employee. Be defensive at first. Make excuses for your low performance. Only open up if the Manager (user) shows real empathy and asks the right questions.",
                icon: "UserCog",
                output_type: "learning_plan",
                mode: "mentorship",
                scenario_type: "mentorship"
            },
            {
                title: "Mentorship: Low-Price Negotiation (Expert Demo)",
                description: "Learn by watching an expert Salesperson handle a difficult customer. You play the Customer, the AI plays the expert Salesperson.",
                ai_role: "Expert Salesperson",
                user_role: "Retail Buyer / Customer",
                scenario: "CONTEXT: MENTORSHIP SESSION. The user plays a difficult customer. The AI plays the 'Expert Salesperson' demonstrating value selling and objection handling. \n\nAI BEHAVIOR: VAlUE SELLING. Do not discount early. Ask questions to find needs. Pivot from price to value.",
                icon: "UserCog",
                output_type: "learning_plan",
                mode: "mentorship",
                scenario_type: "mentorship"
            }
        ]
    }
]

export default function Practice() {
    const navigate = useNavigate()

    const [selectedCharacter, setSelectedCharacter] = useState<"alex" | "sarah">("alex")
    const [categories, setCategories] = useState<any[]>(DEFAULT_SCENARIOS)
    const [activeMode, setActiveMode] = useState<"practice" | "mentorship">("practice")

    // Fetch scenarios
    useEffect(() => {
        const fetchScenarios = async () => {
            try {
                const res = await fetch(getApiUrl('/api/scenarios'))
                if (res.ok) {
                    const data = await res.json()
                    if (data && data.length > 0) {
                        setCategories(data)
                    }
                }
            } catch (e) {
                console.error(e)
            }
        }
        fetchScenarios()
    }, [])



    const handleStartSession = async (data: {
        role: string
        ai_role: string
        scenario: string
        scenario_type?: string
        ai_character?: string
    }) => {
        try {
            // Get authenticated user from Supabase
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error("Please log in", {
                    description: "You need to be logged in to start a session."
                });
                return;
            }

            // Call backend to create session
            const response = await fetch(getApiUrl('/session/start'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: data.role,
                    ai_role: data.ai_role,
                    scenario: data.scenario,
                    framework: 'auto',
                    scenario_type: data.scenario_type,
                    user_id: user.id,  // Use Supabase user ID
                    ai_character: data.ai_character || selectedCharacter // Pass character choice
                })
            })

            if (!response.ok) {
                throw new Error('Failed to start session')
            }

            const result = await response.json()
            const session_id = result.session_id
            const summary = result.summary

            // Also save to localStorage for offline reference
            localStorage.setItem(
                `session_${session_id}`,
                JSON.stringify({
                    role: data.role,
                    ai_role: data.ai_role,
                    scenario: data.scenario,
                    createdAt: new Date().toISOString(),
                    transcript: [{ role: "assistant", content: summary }],
                    sessionId: session_id,
                    completed: false,
                    scenario_type: result.scenario_type || 'custom',
                    ai_character: result.ai_character || data.ai_character // Prioritize backend confirmation
                }),
            )

            navigate(`/conversation/${session_id}`)

        } catch (error) {
            console.error("Error starting session:", error)

            toast.error("Failed to start session", {
                description: "Please make sure the backend is running."
            })
            toast.error("Failed to start session", {
                description: "Please make sure the backend is running."
            })
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 relative overflow-x-hidden">
            <Navigation />

            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[10%] right-[5%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-pulse-glow" />
                <div className="absolute bottom-[10%] left-[5%] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
            </div>

            <main className="container mx-auto px-6 pt-32 pb-[232px]">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-20 relative z-10"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold uppercase tracking-wider mb-6 animate-fade-in-up">
                        <Sparkles className="w-4 h-4" /> AI Training Arena
                    </div>
                    <h1 className="text-3xl sm:text-5xl md:text-7xl font-black mb-6 tracking-tight leading-none">
                        Practice Conversations <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500 animate-gradient">
                            That Matter
                        </span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Select a partner, choose your mode, and master your skills.
                    </p>
                </motion.div>

                {/* Character Selection */}
                <div className="flex flex-col items-center mb-20 relative">
                    <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent -z-10" />
                    <div className="bg-background px-4 relative z-10 mb-8">
                        <span className="text-xs font-black text-primary tracking-[0.2em] uppercase border border-primary/50 bg-primary/10 px-3 py-1 rounded-full">Step 01</span>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-8 tracking-tight">Select Your Partner</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 w-full max-w-2xl px-4">
                        {[
                            {
                                id: "alex",
                                name: "Alex",
                                role: "Senior AI Coach",
                                desc: "Fully adaptive roleplay partner. Shifts dynamically between evaluation and mentorship.",
                                img: "/alex.png",
                                voice: "Deep Male Voice (Onyx)",
                                color: "blue",
                                traits: ["Scenario Adaptive", "Real-time Feedback", "Role Improvisation"]
                            },
                            {
                                id: "sarah",
                                name: "Sarah",
                                role: "Senior AI Coach",
                                desc: "Fully adaptive roleplay partner. Shifts dynamically between evaluation and mentorship.",
                                img: "/sarah.png",
                                voice: "Natural Female Voice (Nova)",
                                color: "purple",
                                traits: ["Scenario Adaptive", "Real-time Feedback", "Role Improvisation"]
                            }
                        ].map((char) => (
                            <motion.button
                                key={char.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedCharacter(char.id as any)}
                                className={`relative group overflow-hidden rounded-3xl border-2 transition-all duration-300 text-left h-full flex flex-col ${selectedCharacter === char.id
                                    ? `border-${char.color}-500 bg-gradient-to-b from-${char.color}-900/40 to-card shadow-[0_0_40px_rgba(${char.color === 'blue' ? '59,130,246' : '168,85,247'},0.3)]`
                                    : "border-border bg-card/40 hover:bg-card/60 hover:border-primary/50"
                                    }`}
                            >
                                <div className="relative h-64 overflow-hidden w-full">
                                    <div className={`absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent z-10`} />
                                    <img
                                        src={char.img}
                                        alt={char.name}
                                        className={`w-full h-full object-cover transition-transform duration-700 ${selectedCharacter === char.id ? 'scale-105' : 'group-hover:scale-110 opacity-60 group-hover:opacity-100'}`}
                                    />

                                    {/* Selection Check */}
                                    {selectedCharacter === char.id && (
                                        <div className="absolute top-4 right-4 z-20">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className={`w-10 h-10 rounded-full bg-${char.color}-500 flex items-center justify-center shadow-lg border-2 border-white/20`}
                                            >
                                                <Check className="w-6 h-6 text-white" />
                                            </motion.div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 relative z-20 -mt-20 flex-1 flex flex-col">
                                    <div className="mb-auto">
                                        <h4 className={`text-3xl font-black mb-1 ${selectedCharacter === char.id ? "text-foreground" : "text-muted-foreground"}`}>{char.name}</h4>
                                        <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${selectedCharacter === char.id ? `text-${char.color}-400` : "text-muted-foreground"}`}>{char.role}</p>

                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {char.desc}
                                        </p>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>




                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-6xl mx-auto"
                >
                    <div className="space-y-12">
                        {/* Mode Toggle for Guided */}

                        {/* Step 2 Header */}
                        <div className="flex flex-col items-center mb-8 relative">
                            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent -z-10" />
                            <div className="bg-background px-4 relative z-10 mb-8">
                                <span className="text-xs font-black text-indigo-500 tracking-[0.2em] uppercase border border-indigo-900/50 bg-indigo-900/20 px-3 py-1 rounded-full">Step 02</span>
                            </div>
                            <h3 className="text-2xl font-bold text-foreground tracking-tight">Choose Your Challenge</h3>
                        </div>

                        <div className="flex justify-center mb-12">
                            <div className="bg-card/40 p-1.5 rounded-xl border border-border flex gap-1 backdrop-blur-md">
                                <button
                                    onClick={() => setActiveMode("practice")}
                                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeMode === 'practice'
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                        }`}
                                >
                                    Skill Assessment
                                </button>
                                <button
                                    onClick={() => setActiveMode("mentorship")}
                                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeMode === 'mentorship'
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-900/30'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                        }`}
                                >
                                    Mentorship Mode
                                </button>
                            </div>
                        </div>

                        {categories.filter(cat => {
                            if (activeMode === 'practice') return cat.name.includes("Skill Assessment")
                            if (activeMode === 'mentorship') return cat.name.includes("Mentorship")
                            return true
                        }).map((category, idx) => (
                            <div key={idx} className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className={`h-8 w-1 bg-gradient-to-b ${category.color} rounded-full`} />
                                    <h3 className="text-2xl font-bold text-foreground tracking-tight">{category.name}</h3>
                                </div>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {category.scenarios.map((scenario: any, sIdx: number) => {
                                        const Icon = ICON_MAP[scenario.icon] || Sparkles
                                        // Use scenario_type for badge display
                                        const scenarioType = scenario.scenario_type || 'custom'
                                        const typeLabels: any = {
                                            'coaching': 'Coaching',
                                            'negotiation': 'Negotiation',
                                            'reflection': 'Reflection',
                                            'mentorship': 'Mentorship',
                                            'custom': 'Custom'
                                        }
                                        const typeColors: any = {
                                            'coaching': 'bg-blue-500/10 text-slate-900 dark:text-blue-300 border-blue-500/30',
                                            'negotiation': 'bg-green-500/10 text-slate-900 dark:text-green-300 border-green-500/30',
                                            'reflection': 'bg-purple-500/10 text-slate-900 dark:text-purple-300 border-purple-500/30',
                                            'mentorship': 'bg-emerald-500/10 text-slate-900 dark:text-emerald-300 border-emerald-500/30',
                                            'custom': 'bg-amber-500/10 text-slate-900 dark:text-amber-300 border-amber-500/20'
                                        }
                                        const typeIcons: any = {
                                            'coaching': Users,
                                            'negotiation': ShoppingCart,
                                            'reflection': GraduationCap,
                                            'mentorship': UserCog,
                                            'custom': Sparkles
                                        }
                                        const modeLabel = typeLabels[scenarioType] || 'Custom'
                                        const ModeIcon = typeIcons[scenarioType] || Sparkles
                                        const badgeColor = typeColors[scenarioType] || typeColors['custom']

                                        // Dynamic Role Handling
                                        let displayAiRole = scenario.ai_role
                                        let displayDescription = scenario.description

                                        // Update text for Learning scenario (Coach Alex/Sarah) or "AI Coach"
                                        if (scenario.scenario_type === 'reflection' || displayAiRole.includes('Coach Alex') || displayAiRole === 'AI Coach') {
                                            const charName = selectedCharacter === 'sarah' ? 'Sarah' : 'Alex'
                                            displayAiRole = `Coach ${charName}`
                                            displayDescription = displayDescription.replace(/Coach Alex/g, `Coach ${charName}`).replace(/AI Coach/g, `Coach ${charName}`)
                                        }

                                        return (
                                            <div
                                                key={sIdx}
                                                onClick={() => handleStartSession({
                                                    role: scenario.user_role,
                                                    ai_role: displayAiRole,
                                                    scenario: scenario.scenario,
                                                    scenario_type: scenario.scenario_type,
                                                    ai_character: selectedCharacter
                                                })}
                                                className="group relative p-6 bg-card/40 hover:bg-card/60 border border-border/50 hover:border-primary/30 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden"
                                            >
                                                <div className={`absolute top-0 right-0 p-16 rounded-full blur-2xl opacity-0 group-hover:opacity-10 bg-gradient-to-br ${category.color} transition-opacity duration-500`} />

                                                <div className="relative z-10">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className={`w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 text-muted-foreground group-hover:text-foreground`}>
                                                            <Icon className="w-6 h-6" />
                                                        </div>
                                                        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeColor} flex items-center gap-1.5`}>
                                                            <ModeIcon className="w-3 h-3" />
                                                            {modeLabel}
                                                        </div>
                                                    </div>

                                                    <h4 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{scenario.title}</h4>
                                                    <p className="text-muted-foreground line-clamp-3 mb-4 leading-relaxed">{displayDescription}</p>

                                                    <div className="flex flex-col gap-2 mb-4">
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="font-bold text-muted-foreground uppercase">Your Role:</span>
                                                            <span className="text-foreground font-medium">{scenario.user_role}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="font-bold text-muted-foreground uppercase">Partner:</span>
                                                            <span className="text-primary font-medium">{displayAiRole}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors mt-4">
                                                        <span>Start Scenario</span>
                                                        <Swords className="w-3 h-3" />
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div >
            </main >
        </div >
    )
}
