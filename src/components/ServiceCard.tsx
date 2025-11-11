import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, DollarSign } from 'lucide-react';

interface ServiceCardProps {
  name: string;
  description: string;
  price: number;
  duration: number;
  imageUrl: string;
  onBook: () => void;
  isLoggedIn: boolean;
}

const ServiceCard = ({ name, description, price, duration, imageUrl, onBook, isLoggedIn }: ServiceCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-medium transition-all duration-300 bg-gradient-card">
      <div className="h-48 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <CardHeader>
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription className="line-clamp-2">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-accent" />
            <span className="font-semibold text-foreground">${price}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-primary" />
            <span>{duration} min</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onBook} 
          className="w-full"
          disabled={!isLoggedIn}
        >
          {isLoggedIn ? 'Book Now' : 'Login to Book'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;
