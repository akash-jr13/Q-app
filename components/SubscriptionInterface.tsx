
import React, { useState } from 'react';
import { Check, Info, ArrowLeft, Heart, Gift } from 'lucide-react';
import { UserProfile } from '../utils/cloud';

interface SubscriptionInterfaceProps {
    userProfile: UserProfile | null;
    onExit: () => void;
}

export const SubscriptionInterface: React.FC<SubscriptionInterfaceProps> = ({ userProfile: _userProfile, onExit }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
    const [trialDays, setTrialDays] = useState(5); // Default 5 days

    // Derived state for example
    const maxDays = 5;
    const progressPercentage = (trialDays / maxDays) * 100;

    return (
        <div className="min-h-screen bg-[#000000] text-[#e8eaed] font-sans p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onExit}
                                className="p-2 rounded-xl bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <h1 className="text-2xl font-bold tracking-tight text-white">Plans & Access</h1>
                        </div>
                        <p className="text-[#9aa0a6] text-sm ml-14">Manage your subscription plan and trial balance.</p>
                    </div>
                    <button className="text-xs font-bold uppercase tracking-widest text-[#9aa0a6] hover:text-white flex items-center gap-2">
                        <Info size={14} /> Docs
                    </button>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Current Plan Card */}
                    <div className="bg-[#121212] rounded-2xl p-6 border border-zinc-800 flex flex-col justify-between h-40 relative overflow-hidden group">
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                                    <Heart size={24} fill="currentColor" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">You're on Free Plan</h3>
                                    <p className="text-zinc-400 text-sm">Upgrade anytime for full access</p>
                                </div>
                            </div>
                            <button className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors">
                                Manage
                            </button>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    </div>

                    {/* Days Remaining Card */}
                    <div className="bg-[#121212] rounded-2xl p-6 border border-zinc-800 flex flex-col justify-between h-40">
                        <div className="flex justify-between items-end mb-2">
                            <h3 className="text-sm font-bold text-white">Trial Days Remaining</h3>
                            <span className="text-sm font-mono text-zinc-400">{trialDays} of {maxDays}</span>
                        </div>

                        <div className="space-y-4">
                            <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <Check size={12} className="text-zinc-600" />
                                    <span>No days will rollover</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <div className="w-1 h-1 rounded-full bg-blue-600" />
                                    <span>Daily usage counted at midnight</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Pro Plan */}
                    <div className="bg-[#121212] rounded-2xl p-6 border border-zinc-800 flex flex-col h-full relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />

                        <div className="mb-6 space-y-4">
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-white">Pro</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Designed for dedicated students tracking serious progress.
                                </p>
                            </div>

                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-white">$25</span>
                                <span className="text-zinc-500 text-sm">per month</span>
                            </div>
                            <div className="text-xs text-zinc-500">shared across unlimited devices</div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`text-xs font-bold transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-zinc-500'}`}
                                >
                                    Monthly
                                </button>
                                <div
                                    className="w-8 h-4 bg-zinc-800 rounded-full relative cursor-pointer p-0.5 transition-colors"
                                    onClick={() => setBillingCycle(c => c === 'monthly' ? 'annual' : 'monthly')}
                                >
                                    <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-300 ${billingCycle === 'annual' ? 'translate-x-4' : ''}`} />
                                </div>
                                <button
                                    onClick={() => setBillingCycle('annual')}
                                    className={`text-xs font-bold transition-colors ${billingCycle === 'annual' ? 'text-white' : 'text-zinc-500'}`}
                                >
                                    Annual
                                </button>
                            </div>
                        </div>

                        <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 mb-6">
                            Upgrade
                        </button>

                        <div className="space-y-4 flex-1">
                            <div className="p-3 bg-zinc-900/50 rounded-lg flex items-center justify-between border border-zinc-800">
                                <span className="text-sm text-zinc-300">Unlimited Access</span>
                                <Check size={16} className="text-indigo-400" />
                            </div>

                            <div className="space-y-3 pt-2">
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">All features in Free, plus:</p>
                                {[
                                    "Unlimited Practice Tests",
                                    "Advanced Analytics & Insights",
                                    "Peer Comparison Data",
                                    "Priority Support"
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                                        <Check size={14} className="text-white shrink-0" />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Referral Extension Card (Custom Addition for "Share" request) */}
                    <div className="bg-[#121212] rounded-2xl p-6 border border-zinc-800 flex flex-col h-full relative overflow-hidden lg:col-span-2">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5" />

                        <div className="relative z-10 flex flex-col h-full justify-center items-center text-center space-y-6">
                            <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] flex items-center justify-center border border-zinc-800 shadow-xl">
                                <Gift size={32} className="text-indigo-400" />
                            </div>

                            <div className="space-y-2 max-w-md">
                                <h3 className="text-2xl font-bold text-white">Need more time?</h3>
                                <p className="text-zinc-400">
                                    Share Understood with a friend and get <span className="text-white font-bold">+1 Day</span> of full access added to your trial instantly.
                                </p>
                            </div>

                            <button
                                onClick={() => setTrialDays(prev => Math.min(prev + 1, 30))}
                                className="px-8 py-3 bg-white text-black hover:bg-zinc-200 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center gap-2 transform active:scale-95"
                            >
                                <Gift size={16} />
                                Share & Extend Trial
                            </button>

                            <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                                * Limited to 1 extension per unique referral
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
