"use client";

import productImage from "@/assets/dashboard.png";
import { useState } from "react";
import FeatureTab from "@/components/landing/FeatureTab";
import { tabs } from "@/components/landing/type";
import {
    animate,
    motion,
    useMotionTemplate,
    useMotionValue,
    ValueAnimationTransition,
} from "framer-motion";

// Features section
const Features = () => {
    const [selectedTab, setSelectedTab] = useState(0);

    const backgroundPositionX = useMotionValue(tabs[0].backgroundPositionX);
    const backgroundPositionY = useMotionValue(tabs[0].backgroundPositionY);
    const backgroundSizeX = useMotionValue(tabs[0].backgroundSizeX);

    const backgroundPosition = useMotionTemplate`${backgroundPositionX}% ${backgroundPositionY}%`;
    const backgroundSize = useMotionTemplate`${backgroundSizeX}% auto`;

    const handleSelectedTab = (index: number) => {
        setSelectedTab(index);

        const options: ValueAnimationTransition = {
            duration: 2,
            ease: "easeInOut",
        };

        animate(
            backgroundSizeX,
            [backgroundSizeX.get(), 100, tabs[index].backgroundSizeX],
            options,
        );
        animate(
            backgroundPositionX,
            [backgroundPositionX.get(), tabs[index].backgroundPositionX],
            options,
        );
        animate(
            backgroundPositionY,
            [backgroundPositionY.get(), tabs[index].backgroundPositionY],
            options,
        );
    };

    return (
        <section className="py-20 md:py-24">
            <div className="container">
                <h2 className=" text-3xl font-bold text-center md:text-4xl">
                    Powerful Features to Boost Your Learning
                </h2>
                <p className="mt-4 text-center text-lg text-muted-foreground max-w-2xl mx-auto">
                    Explore the fined tuned features designed to enhance your vocabulary
                    learning experience.
                </p>
                <div className="mt-10 flex flex-col lg:flex-row gap-3">
                    {tabs.map((tab, tabIndex) => (
                        <FeatureTab
                            {...tab}
                            onClick={() => handleSelectedTab(tabIndex)}
                            selected={selectedTab === tabIndex}
                            key={tab.title}
                        />
                    ))}
                </div>
                <div className="border border-white/20 rounded-xl mt-3 p-2.5">
                    <motion.div
                        className="aspect-video border border-white/20 rounded-lg bg-cover"
                        style={{
                            backgroundSize,
                            backgroundPosition,
                            backgroundImage: `url(${productImage.src})`,
                        }}
                    />
                </div>
            </div>
        </section>
    );
};

export default Features;