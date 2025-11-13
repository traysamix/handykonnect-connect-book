import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  client: {
    full_name: string;
  };
}

interface ReviewsListProps {
  serviceId: string;
}

const ReviewsList = ({ serviceId }: ReviewsListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [serviceId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          client:profiles(full_name)
        `)
        .eq('service_id', serviceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading reviews...</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No reviews yet. Be the first to review!
      </div>
    );
  }

  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 pb-4 border-b">
        <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
        <div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= Math.round(averageRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </div>
        </div>
      </div>

      {reviews.map((review) => (
        <Card key={review.id}>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <Avatar>
              <AvatarFallback>
                {review.client.full_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-semibold">{review.client.full_name}</div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date(review.created_at).toLocaleDateString()}
            </div>
          </CardHeader>
          {review.comment && (
            <CardContent>
              <p className="text-muted-foreground">{review.comment}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default ReviewsList;
