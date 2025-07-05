"use client";
import React from "react";
import { motion } from "motion/react";

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: typeof testimonials;
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-background"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div className="p-10 rounded-3xl border shadow-lg shadow-primary/10 max-w-xs w-full" key={i}>
                  <div>{text}</div>
                  <div className="flex items-center gap-2 mt-5">
                    <img
                      width={40}
                      height={40}
                      src={image}
                      alt={name}
                      className="h-10 w-10 rounded-full"
                    />
                    <div className="flex flex-col">
                      <div className="font-medium tracking-tight leading-5">{name}</div>
                      <div className="leading-5 opacity-60 tracking-tight">{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};

const testimonials = [
  {
    text: "This UX analysis tool completely transformed how we approach website optimization. The insights are incredibly detailed and actionable.",
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    name: "Sarah Chen",
    role: "UX Designer",
  },
  {
    text: "Within minutes, I got comprehensive feedback that would have taken our team weeks to compile. The science-backed recommendations are spot-on.",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    name: "Marcus Johnson",
    role: "Product Manager",
  },
  {
    text: "The automated analysis saved us countless hours of manual UX auditing. Our conversion rate improved by 40% after implementing the suggestions.",
    image: "https://randomuser.me/api/portraits/women/3.jpg",
    name: "Emily Rodriguez",
    role: "Digital Marketing Manager",
  },
  {
    text: "As a startup founder, this tool gives me enterprise-level UX insights without the enterprise budget. It's like having a UX team on demand.",
    image: "https://randomuser.me/api/portraits/men/4.jpg",
    name: "David Park",
    role: "CEO & Founder",
  },
  {
    text: "The evidence-based approach to UX analysis is exactly what our development team needed. No more guesswork, just proven principles.",
    image: "https://randomuser.me/api/portraits/women/5.jpg",
    name: "Lisa Thompson",
    role: "Frontend Developer",
  },
  {
    text: "I've used many UX tools, but none provide such comprehensive analysis so quickly. The accessibility insights alone are worth it.",
    image: "https://randomuser.me/api/portraits/women/6.jpg",
    name: "Rachel Kim",
    role: "Accessibility Specialist",
  },
  {
    text: "This tool helped us identify critical UX issues we completely missed. Our user satisfaction scores increased significantly after the fixes.",
    image: "https://randomuser.me/api/portraits/men/7.jpg",
    name: "James Wilson",
    role: "Head of Product",
  },
  {
    text: "The speed and accuracy of the analysis is remarkable. It's become an essential part of our design review process.",
    image: "https://randomuser.me/api/portraits/women/8.jpg",
    name: "Anna Martinez",
    role: "Design Lead",
  },
  {
    text: "Finally, a UX analysis tool that speaks our language. The technical recommendations are practical and easy to implement.",
    image: "https://randomuser.me/api/portraits/men/9.jpg",
    name: "Chris Anderson",
    role: "Engineering Manager",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

const Testimonials = () => {
  return (
    <section className="bg-background my-20 relative">
      <div className="container z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
        >
          <div className="flex justify-center">
            <div className="border py-1 px-4 rounded-lg">Testimonials</div>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter mt-5">
            What our users say
          </h2>
          <p className="text-center mt-5 opacity-75">
            See what our customers have to say about us.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;