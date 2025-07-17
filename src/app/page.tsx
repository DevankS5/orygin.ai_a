import HeroSection from "@/components/hero-section";
import ContentSection from "@/components/content-7";
// import Features from "@/components/features-1";
import { TimelineSection } from "@/components/timeline-2";
import CallToAction from "@/components/call-to-action";
import FooterSection from "@/components/footer";
import FeaturesSection from "@/components/features-section";
// import { div } from "framer-motion/client";
// import Image from "next/image"; 

export default function Home() {
  return( 
    <div>
      <HeroSection />
      <ContentSection />
      {/* <Features /> */}
      <FeaturesSection />
      <TimelineSection />
      <CallToAction />
      <FooterSection />
    
    </div>
    )
  ;
}
