import TestCard from "../TestCard";
import testBanner from "@assets/generated_images/CEFR_test_banner_image_5a92fa47.png";

export default function TestCardExample() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <TestCard
          id="1"
          title="CEFR Og'zaki Test"
          description="Ingliz tilida gapirish ko'nikmangizni baholash uchun professional test"
          price={50000}
          imageUrl={testBanner}
          duration="45 daqiqa"
          onPurchase={(id) => console.log("Purchase test:", id)}
        />
        <TestCard
          id="2"
          title="CEFR Og'zaki Test"
          description="Ingliz tilida gapirish ko'nikmangizni baholash uchun professional test"
          price={50000}
          imageUrl={testBanner}
          duration="45 daqiqa"
          isPurchased={true}
          onStart={(id) => console.log("Start test:", id)}
        />
      </div>
    </div>
  );
}
