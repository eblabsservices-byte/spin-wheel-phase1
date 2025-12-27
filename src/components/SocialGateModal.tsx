'use client'

import { useState, useEffect } from 'react'

// Replaced with internal SVG for zero-dependency safety if lucide is missing.
const Check = ({ size = 20, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"></polyline></svg>
)

interface SocialGateModalProps {
    isOpen: boolean
    onComplete?: () => void
    onClose?: () => void // New prop for read-only closing
    readOnly?: boolean // New prop for Status Page
}

export default function SocialGateModal({ isOpen, onComplete, onClose, readOnly = false }: SocialGateModalProps) {
    const [agreed, setAgreed] = useState(false)
    const [instaClicked, setInstaClicked] = useState(false)
    const [waClicked, setWaClicked] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Contact Info State
    const [needsContactInfo, setNeedsContactInfo] = useState(false) // Triggered if user has no phone
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [contactError, setContactError] = useState('')
    const [checkedProfile, setCheckedProfile] = useState(false);

    // Fetch Profile check when Modal opens (if not readOnly)
    // Fetch Profile check when Modal opens (if not readOnly)
    useEffect(() => {
        if (isOpen && !readOnly && !checkedProfile) {
            // Just check if agreed, technically we don't need phone check anymore since Login enforces it.
            // But we keep the fetch to ensure session serves valid data.
            fetch('/api/Participant/check')
                .then(r => r.json())
                .then(d => {
                    // NO CONTACT FORM CHECK - Login already handles this.
                    // if (d.phoneMasked === "Linked via Google" || !d.phoneMasked) { ... }
                    setCheckedProfile(true);
                })
                .catch(() => setCheckedProfile(true));
        }
    }, [isOpen, readOnly, checkedProfile]);

    if (!isOpen) return null


    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setContactError("");

        if (!name || name.trim().length < 2) return setContactError("Valid name required.");

        // Strict Phone Validation
        const cleanPhone = phone.replace(/\D/g, '');
        if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
            return setContactError("Enter valid 10-digit Indian mobile number .");
        }

        // Prevent repeated digits (e.g., 9999999999, 1231231231 is harder, but simplified repeated digits)
        if (/^(\d)\1{9}$/.test(cleanPhone)) {
            return setContactError("Please enter a valid active mobile number.");
        }

        setIsSubmitting(true);
        try {
            // 1. Update Profile
            const res = await fetch('/api/Participant/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone: cleanPhone })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Update failed");

            setNeedsContactInfo(false); // Move to next step
        } catch (err: any) {
            setContactError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // In read-only mode, we just show content. No actions needed.
    const canProceed = readOnly ? true : (agreed && instaClicked && waClicked)

    const handleComplete = async () => {
        if (readOnly) {
            onClose?.()
            return
        }

        setIsSubmitting(true)
        try {
            // Persist Terms Agreement in Backend (Session Based)
            await fetch('/api/Participant/agree-terms', { method: 'POST' });
            // Proceed
            onComplete?.()
        } catch (e) {
            console.error("Failed to save terms", e)
            onComplete?.()
        } finally {
            setIsSubmitting(false)
        }
    }


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className={`w-full max-w-md bg-white rounded-2xl p-4 sm:p-8 shadow-2xl relative overflow-hidden animate-slide-up my-auto
                ${readOnly ? 'max-h-[85vh] flex flex-col' : ''}`}>

                {/* Decorative Background */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-yellow-400 to-red-500"></div>

                {readOnly && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-20"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                )}

                {/* --- CONTACT FORM STEP --- */}
                {needsContactInfo && !readOnly ? (

                    <div className="text-center space-y-6">
                        {/* <h2 className="text-2xl font-bold text-gray-800">Complete Your Profile 📝</h2>
                        <p className="text-gray-500 text-sm">We need your contact details to deliver your prize!</p>

                        <form onSubmit={handleContactSubmit} className="space-y-4 text-left">
                            {contactError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{contactError}</div>}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-red-500 outline-none"
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (+91)</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setPhone(val);
                                    }}
                                    className="w-full p-3 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-red-500 outline-none"
                                    placeholder="9876543210 (No +91)"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition"
                            >
                                {isSubmitting ? 'Saving...' : 'Continue'}
                            </button>
                        </form> */}
                    </div>
                ) : (
                    /* --- EXISTING SOCIAL STEPS --- */
                    <>
                            {/* Heading */}
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                    {readOnly ? 'Terms & Conditions 📜' : 'Almost There! 🎁'}
                                </h2>
                                {/* old header */}
                                {/* <div className='flex flex-col space-y-2'>
                                <div className="flex flex-col space-y-2">
                                    <p className="text-gray-800 font-bold text-sm">100% Guaranteed Gift on Every Spin 🤩 </p>
                                    <p className="text-gray-600 text-sm">
                                        {readOnly
                                            ? 'Please review our event terms below.'
                                            : 'Complete the following two steps to unlock your spin.'}
                                    </p>
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <p className="text-gray-800 font-bold text-sm">ഓരോ സ്പിന്നിലും 100% സമ്മാനം ഉറപ്പ് 🤩 </p>
                                    <p className="text-gray-600 text-sm">
                                        {readOnly
                                            ? 'Please review our event terms below.'
                                            : 'സ്പിൻ അൺലോക്ക് ചെയ്യാൻ താഴെ പറയുന്ന 2 Steps പൂർത്തിയാക്കൂ.'}
                                    </p>
                                </div>
                            </div> */}
                                {/* New header */}
                                <div className="flex flex-col text-start space-y-3">
                                    {/* English Section */}
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-gray-800 font-bold text-sm">
                                            🎁 100% Guaranteed Gift on Every Spin
                                        </p>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {readOnly
                                                ? 'Please read the event terms below carefully.'
                                                : (
                                                    <>
                                                        Complete the 2 simple steps below. <br />
                                                        <span className="font-bold text-gray-800">After opening Instagram or WhatsApp, you must return to this page to unlock your spin.</span>
                                                    </>
                                                )}
                                        </p>
                                    </div>

                                    {/* Malayalam Section */}
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-gray-800 font-bold text-sm">
                                            🎁 ഓരോ സ്പിന്നിലും 100% സമ്മാനം ഉറപ്പ്
                                        </p>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {readOnly
                                                ? 'ദയവായി താഴെ നൽകിയിരിക്കുന്ന ഇവന്റ് നിബന്ധനകൾ ശ്രദ്ധിച്ച് വായിക്കുക.'
                                                : (
                                                    <>
                                                        'താഴെ കാണുന്ന 2 ലളിതമായ ഘട്ടങ്ങൾ പൂർത്തിയാക്കൂ. <br />
                                                        <span className="font-bold text-gray-800">Instagram അല്ലെങ്കിൽ WhatsApp തുറന്നതിന് ശേഷം, വീണ്ടും ഈ പേജിലേക്ക് തിരികെ വന്നാൽ മാത്രമേ സ്പിൻ തുടരാൻ കഴിയൂ.</span>'
                                                    </>
                                                )}
                                        </p>
                                    </div>
                                </div>
                            </div>


                            <div className="space-y-4">
                                {/* Step 1: Instagram */}
                                {!readOnly && (
                                    <div className="animate-fade-in-up">
                                        <a
                                            href="https://www.instagram.com/yesbharathweddingcollections/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => setInstaClicked(true)}
                                            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all group relative
                                    ${instaClicked ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-pink-200 hover:bg-pink-50 cursor-pointer'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${instaClicked ? 'bg-green-100 text-green-600' : 'bg-pink-100 text-pink-600'}`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="font-bold text-gray-800">Step 1:<br /> Follow us on Instagram</h3>
                                                    <p className="text-xs text-gray-500">{instaClicked ? 'Completed' : 'Tap to Follow'}</p>
                                                </div>
                                            </div>
                                            {instaClicked && <div className="p-1 rounded-full bg-green-500 text-white"><Check size={14} /></div>}
                                        </a>
                                    </div>
                                )}

                            {/* Step 2: WhatsApp */}
                                {!readOnly && (
                                    <div className="animate-fade-in-up delay-100">
                                        <button
                                            onClick={async () => {
                                                setWaClicked(true);

                                                const shareTitle = "YES BHARATH SPIN & WIN CONTEST";
                                                const shareText = "YES BHARATH SPIN & WIN CONTEST\n\n" +
                                                    "Spin & win iPhone 17 and other gifts like Smart TV, Airfryer, JBL GO Bluetooth Speaker, Shirts, Sarees & Gift Vouchers !\n\n" +
                                                    "Spin Here: https://game.yesbharath.org\n\n" +
                                                    "•100% genuine\n" +
                                                    "•All spins get gifts\n" +
                                                    "•No payment required to spin\n\n" +
                                                    "Terms & conditions apply. Gifts redeemable at Yes Bharath Sulthan Bathery showroom only.\n\n" +
                                                    "---\n\n" +
                                                    "YES BHARATH SPIN & WIN മത്സരം\n\n" +
                                                    "iPhone 17, Smart TV, Airfryer, JBL GO Bluetooth Speaker, Shirt, Saree, Gift Voucher എന്നിവ ഉൾപ്പെടുന്ന ഉറപ്പുള്ള സമ്മാനങ്ങൾ നേടാനുള്ള അവസരം !\n\n" +
                                                    "•100% യഥാർത്ഥ പ്രമോഷൻ\n" +
                                                    "•എല്ലാ സ്പിന്നുകൾക്കും സമ്മാനം ഉറപ്പ്\n" +
                                                    "•സ്പിൻ ചെയ്യാൻ പണം നൽകേണ്ടതില്ല\n\n" +
                                                    "നിബന്ധനകൾ ബാധകമാണ്. സമ്മാനങ്ങൾ Yes Bharath സുൽത്താൻ  ബത്തേരി ഷോറൂമിൽ നിന്നുമാത്രം ലഭ്യമാകും.";

                                                const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

                                                if (isMobile) {
                                                    // Mobile: Use Universal Link 'wa.me' via location.href
                                                    // This prevents 'about:blank' tabs on iOS
                                                    window.location.href = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
                                                } else {
                                                    // Desktop: Open WhatsApp Web in new tab
                                                    window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
                                                }
                                            }}
                                            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all group
                                    ${waClicked ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-green-200 hover:bg-green-50 cursor-pointer'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${waClicked ? 'bg-green-100 text-green-500' : 'bg-green-100 text-green-500'}`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="font-bold text-gray-800">Step 2:<br /> Share this with 3 WhatsApp groups</h3>
                                                    <p className="text-xs text-gray-500">{waClicked ? 'Completed' : 'Tap to Share'}</p>
                                                </div>
                                            </div>
                                            {waClicked && <div className="p-1 rounded-full bg-green-500 text-white"><Check size={14} /></div>}
                                        </button>
                                    </div>
                                )}
                                {/* Step 3: Terms */}
                                <div className="animate-fade-in-up delay-200">
                                    {/* Rules & Regulations Info Box */}
                                    <div className={`bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-left space-y-2 mt-4 overflow-y-auto custom-scrollbar md:max-w-[800px] mx-auto
                                        ${readOnly ? 'max-h-[70vh]' : 'max-h-70'}`}>
                                        {/* ${readOnly ? 'max-h-[70vh]' : 'max-h-70'}`}> */}
                                        <h4 className="font-bold text-yellow-800 text-sm flex items-center gap-2 sticky top-0 bg-yellow-50 pb-2 border-b border-yellow-100 w-full z-10">
                                            <span className="text-lg">📜</span> LUCKY SPIN – TERMS & CONDITIONS
                                        </h4>
                                        <div className="text-xs text-yellow-900/90 space-y-3 pt-2">
                                            <ol className="list-decimal pl-4 space-y-2">
                                                <li>
                                                    This Lucky Spin contest is organised by <strong>Yes Bharath Wedding Collections</strong> for
                                                    <strong> marketing and promotional purposes only</strong>.
                                                </li>

                                                <li>
                                                    <strong>Event Validity:</strong> This Lucky Spin contest is valid only from
                                                    <strong> 25 December 2025 to 31 December 2026 (10:00 PM IST)</strong>.
                                                    Spins attempted outside this period will not be considered.
                                                </li>

                                                <li><strong>All spins are assured gifts.</strong> The gift shown after the spin is final.</li>

                                                <li>
                                                    <strong>All gifts must be redeemed only at Yes Bharath Wedding Collections – Sulthan Bathery showroom.</strong>
                                                </li>

                                                <li>
                                                    <strong>No delivery or courier facility is available</strong> for any gift, as this is an
                                                    in-store promotional activity and customer verification is mandatory.
                                                </li>

                                                <li>
                                                    <strong>Spin code is mandatory</strong> for gift redemption and is
                                                    <strong> one-time use only</strong>.
                                                </li>

                                                <li>The mobile number used for the spin <strong>must match</strong> at the time of redemption.</li>

                                                <li>
                                                    <strong>iPhone 17, Smart TV, Airfryer, JBL GO Bluetooth Speaker, Shirt and Saree</strong> will be issued
                                                    <strong> only after successful verification</strong> of:
                                                    <ul className="list-disc pl-4 mt-1 space-y-1">
                                                        <li>Valid spin code</li>
                                                        <li>Registered mobile number</li>
                                                        <li>Following our official Instagram page</li>
                                                        <li>Sharing the contest in <strong>minimum 3 WhatsApp groups</strong></li>
                                                    </ul>
                                                </li>

                                                <li>
                                                    Gifts, vouchers, and discounts are <strong>non-transferable</strong> and
                                                    <strong> cannot be exchanged or redeemed for cash</strong>.
                                                </li>

                                                <li>
                                                    Physical gift items are subject to <strong>stock availability</strong>.
                                                    Size, colour, model, or design selection is at <strong>management discretion</strong>.
                                                </li>

                                                <li>
                                                    This contest is <strong>not a lottery or gambling scheme</strong>.
                                                    It is a genuine promotional activity conducted for customer engagement and benefits.
                                                </li>

                                                <li>
                                                    Any misuse, duplication, manipulation, or false claim will result in
                                                    <strong> immediate disqualification</strong>.
                                                </li>

                                                <li>
                                                    The organiser reserves the right to <strong>modify future spin logic</strong> in case of
                                                    unusually high participation, without affecting completed spins.
                                                </li>

                                                <li><strong>Management decision will be final</strong> in all matters related to the contest.</li>
                                            </ol>


                                            <h5 className="font-bold text-yellow-800 pt-2 border-t border-yellow-200 mt-2">🎁 GIFT-WISE MINIMUM PURCHASE CONDITIONS</h5>
                                            <ol className="list-decimal pl-4 space-y-1" start={14}>
                                                <li><strong>₹100 Gift Voucher</strong> – valid on a <strong>minimum purchase of ₹1,000</strong>.</li>
                                                <li><strong>₹500 Gift Voucher</strong> – valid on a <strong>minimum purchase of ₹5,000</strong>.</li>
                                                <li><em>Shirt / Saree</em> – gift items, collectable from the store <em>after successful verification</em> of the spin code and registered mobile number.</li>
                                                <li><em>IPhone 17, Haier Smart TV (32”), iBell Airfryer & JBL GO Bluetooth Speaker</em> – gift items with no cash alternative or exchange, issued only after complete verification as per contest rules.</li>
                                            </ol>

                                            <div className="pt-6 mt-6 border-t-2 border-yellow-200/60">
                                                <h4 className="font-bold text-yellow-800 text-sm flex items-center gap-2 mb-3">
                                                    <span className="text-lg">📜</span> ലക്കി സ്പിൻ – നിബന്ധനകളും വ്യവസ്ഥകളും
                                                </h4>
                                                <ol className="list-decimal pl-4 space-y-2">
                                                    <li>Yes Bharath Wedding Collections സംഘടിപ്പിക്കുന്ന ഈ ലക്കി സ്പിൻ മത്സരം <strong>മാർക്കറ്റിംഗ്, പ്രമോഷണൽ ആവശ്യങ്ങൾക്കായി മാത്രം</strong> ആണ്.</li>
                                                    <li>
                                                        <strong>ഇവന്റ് കാലാവധി:</strong> ഈ Lucky Spin മത്സരം
                                                        <strong> 25 ഡിസംബർ 2025 മുതൽ 31 ഡിസംബർ 2026 രാത്രി 10:00 മണിവരെ (IST)</strong> മാത്രമേ സാധുവായിരിക്കൂ.
                                                        ഈ കാലയളവിന് പുറത്തായി നടത്തിയ സ്പിൻ ശ്രമങ്ങൾ പരിഗണിക്കുന്നതല്ല.
                                                    </li>

                                                    <li><strong>എല്ലാ സ്പിനുകളും ഉറപ്പുള്ള സമ്മാനങ്ങളാണ്.</strong> സ്പിൻ കഴിഞ്ഞ് കാണിക്കുന്ന സമ്മാനം അന്തിമമായിരിക്കും.</li>
                                                    <li>എല്ലാ സമ്മാനങ്ങളും <strong>Yes Bharath Wedding Collections – സുൽത്താൻ ബത്തേരി ഷോറൂമിൽ നിന്നുമാത്രം</strong> റീഡീം ചെയ്യാവുന്നതാണ്.</li>
                                                    <li>ഇത് ഒരു ഇൻ-സ്റ്റോർ പ്രമോഷണൽ പ്രവർത്തനമായതിനാൽ, ഉപഭോക്തൃ പരിശോധന നിർബന്ധമായതിനാൽ <strong>ഡെലിവറി / കൂറിയർ സൗകര്യം ലഭ്യമല്ല</strong>.</li>
                                                    <li><strong>സമ്മാനം കൈപ്പറ്റാൻ സ്പിൻ കോഡ് നിർബന്ധമാണ്</strong>, ഓരോ കോഡും <strong>ഒരു പ്രാവശ്യം മാത്രം</strong> ഉപയോഗിക്കാവുന്നതാണ്.</li>
                                                    <li>സ്പിൻ ചെയ്യുമ്പോൾ ഉപയോഗിച്ച മൊബൈൽ നമ്പർ, സമ്മാനം കൈപ്പറ്റുന്ന സമയത്തും <strong>ഒത്തിരിക്കണം</strong>.</li>
                                                    <li><strong>iPhone 17, Smart TV, Airfryer, JBL GO Bluetooth Speaker, Shirt, Saree</strong> എന്നിവ താഴെപ്പറയുന്നവ <strong>വിജയകരമായി സ്ഥിരീകരിച്ചശേഷം മാത്രം</strong> നൽകുന്നതാണ്:
                                                        <ul className="list-disc pl-4 mt-1 space-y-1">
                                                            <li>സാധുവായ സ്പിൻ കോഡ്</li>
                                                            <li>രജിസ്റ്റർ ചെയ്ത മൊബൈൽ നമ്പർ</li>
                                                            <li>ഞങ്ങളുടെ ഔദ്യോഗിക Instagram പേജ് ഫോളോ ചെയ്തിരിക്കുന്നത്</li>
                                                            <li>മത്സരം <strong>കുറഞ്ഞത് 3 WhatsApp ഗ്രൂപ്പുകളിൽ</strong> ഷെയർ ചെയ്തിരിക്കുന്നത്</li>
                                                        </ul>
                                                    </li>
                                                    <li>സമ്മാനങ്ങളും വൗച്ചറുകളും ഡിസ്‌കൗണ്ടുകളും <strong>മാറ്റിസ്ഥാപിക്കാനോ മറ്റൊരാളിലേക്ക് കൈമാറ്റം ചെയ്യാനോ പണമായി മാറ്റാനോ കഴിയില്ല</strong>.</li>
                                                    <li>ഫിസിക്കൽ ഗിഫ്റ്റ് ഐറ്റങ്ങൾ <strong>സ്റ്റോക്ക് ലഭ്യതയ്ക്ക് വിധേയമായിരിക്കും</strong>. സൈസ്, നിറം, മോഡൽ, ഡിസൈൻ എന്നിവ <strong>മാനേജ്മെന്റിന്റെ തീരുമാനപ്രകാരം</strong> ആയിരിക്കും.</li>
                                                    <li>ഈ മത്സരം <strong>ലോട്ടറിയോ ചൂതാട്ടമോ അല്ല</strong>. ഉപഭോക്തൃ പങ്കാളിത്തത്തിനും ആനുകൂല്യങ്ങൾക്കുമായി നടത്തുന്ന യഥാർത്ഥ പ്രമോഷണൽ പ്രവർത്തനമാണ്.</li>
                                                    <li>ഏതെങ്കിലും തരത്തിലുള്ള ദുരുപയോഗം, പകർപ്പ്, കൃത്രിമം, കള്ള അവകാശവാദം എന്നിവ കണ്ടെത്തിയാൽ <strong>ഉടൻ അയോഗ്യത പ്രഖ്യാപിക്കുന്നതാണ്</strong>.</li>
                                                    <li>അസാധാരണമായ ഉയർന്ന പങ്കാളിത്തം ഉണ്ടായാൽ, ഇതിനകം പൂർത്തിയായ സ്പിനുകളെ ബാധിക്കാതെ, <strong>ഭാവിയിലെ സ്പിൻ ലജിക് മാറ്റാനുള്ള അവകാശം</strong> സംഘാടകർക്ക് ഉണ്ടായിരിക്കും.</li>
                                                    <li>മത്സരവുമായി ബന്ധപ്പെട്ട എല്ലാ കാര്യങ്ങളിലും <strong>മാനേജ്മെന്റിന്റെ തീരുമാനം അന്തിമമായിരിക്കും</strong>.</li>
                                                </ol>

                                                <h5 className="font-bold text-yellow-800 pt-2 border-t border-yellow-200 mt-2">🎁 സമ്മാനങ്ങൾക്ക് അനുബന്ധമായ കുറഞ്ഞ വാങ്ങൽ നിബന്ധനകൾ</h5>
                                                <ol className="list-decimal pl-4 space-y-1" start={14}>
                                                    <li><strong>₹100 ഗിഫ്റ്റ് വൗച്ചർ</strong> – കുറഞ്ഞത് <strong>₹1,000 വാങ്ങലിന് സാധുവാണ്</strong>.</li>
                                                    <li><strong>₹500 ഗിഫ്റ്റ് വൗച്ചർ</strong> – കുറഞ്ഞത് <strong>₹5,000 വാങ്ങലിന് സാധുവാണ്</strong>.</li>
                                                    <li><em>ഷർട്ട് / സാരി</em> – സ്പിൻ കോഡും രജിസ്റ്റർ ചെയ്ത മൊബൈൽ നമ്പറും വിജയകരമായി സ്ഥിരീകരിച്ചശേഷം സ്റ്റോറിൽ നിന്ന് കൈപ്പറ്റാവുന്ന ഗിഫ്റ്റ് ഐറ്റങ്ങളാണ്.</li>
                                                    <li><em>iPhone 17, Haier Smart TV (32”), iBell Airfryer, JBL GO Bluetooth Speaker</em> – പണമായി മാറ്റാനോ കൈമാറ്റം ചെയ്യാനോ കഴിയാത്ത ഗിഫ്റ്റ് ഐറ്റങ്ങളാണ്. മത്സര നിബന്ധനകൾ പ്രകാരമുള്ള പൂർണ്ണമായ സ്ഥിരീകരണത്തിന് ശേഷം മാത്രം നൽകുന്നതാണ്.</li>
                                                </ol>
                                            </div>
                                        </div>
                                    </div>
                                    {!readOnly && (
                                        <label className={`flex items-center p-4 rounded-xl border-2 transition-all mt-4 drop-shadow-md
                                        ${agreed ? 'border-red-500 bg-red-50 cursor-pointer' : 'border-gray-200 hover:border-gray-400 cursor-pointer'}`}>
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${agreed ? 'bg-red-500 border-red-500' : 'border-gray-300 bg-white'}`}>
                                                {agreed && <Check size={12} className="text-white" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={agreed}
                                                onChange={(e) => setAgreed(e.target.checked)}
                                            />
                                            <span className="text-sm text-gray-600 select-none">
                                                I agree to the <span className="font-medium text-gray-900">Terms & Conditions</span>
                                            </span>
                                        </label>
                                    )}
                                </div>

                            </div>

                            {!readOnly && (
                                <button
                                    onClick={handleComplete}
                                    disabled={!canProceed || isSubmitting}
                                    className={`mt-4 w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 flex items-center justify-center
                            ${canProceed
                                            ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white hover:scale-[1.02] active:scale-[0.98] shadow-red-200'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'}`}
                                >
                                    {isSubmitting ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        canProceed ? 'Unlock Spin Now 🔓' : 'Finish Steps above'
                                    )}
                                </button>
                            )}

                            {readOnly && (
                                <div className="mt-6 text-center">
                                    <p className="text-xs text-gray-400">Terms approved</p>
                                </div>
                            )}
                        </>
                )}
            </div>
        </div >
    )
}
