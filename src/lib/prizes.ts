export const PRIZES = [
    { id: "p1", label: "iPhone 17", image: "/gifts/iphone.webp", color: "#d0bfff", redeemCondition: "Grand Prize! Collect from Store" },
    { id: "p2", label: "Haier Smart TV", image: "/gifts/haier-tv.jpg", color: "#51cf66", redeemCondition: "Collect from Store" },
    { id: "p3", label: "iBell Airfryer", image: "/gifts/airfryer.webp", color: "#74c0fc", redeemCondition: "Collect from Store" },
    { id: "p4", label: "JBL GO Speaker", image: "/gifts/jbl-speaker.jpg", color: "#cc5de8", redeemCondition: "Collect from Store" },
    { id: "p5", label: "Shirt", image: "/gifts/shirt.jpg", color: "#ff922b", redeemCondition: "Collect from Store" },
    { id: "p6", label: "Saree", image: "/gifts/saree.jpg", color: "#fab005", redeemCondition: "Collect from Store" },
    { id: "p7", label: "₹500 Voucher", image: "/gifts/₹500voucher.jpg", color: "#fd7e14", redeemCondition: "Min purchase ₹5000" },
    { id: "p8", label: "₹100 Voucher", image: "/gifts/₹100voucher.jpg", color: "#ff6b6b", redeemCondition: "Min purchase ₹1000" },
];

export const getPrizeById = (id: string) => PRIZES.find(p => p.id === id);
