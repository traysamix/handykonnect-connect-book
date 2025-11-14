import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  image_url: string | null;
  is_active: boolean;
}

const ServiceManagement = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_minutes: '',
    image_url: '',
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setServices(data);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('service-images')
      .upload(fileName, file);

    if (uploadError) {
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('service-images')
      .getPublicUrl(fileName);

    setFormData({ ...formData, image_url: publicUrl });
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const serviceData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      duration_minutes: parseInt(formData.duration_minutes),
      image_url: formData.image_url || null,
    };

    if (editingService) {
      const { error } = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', editingService.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update service',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Service updated successfully',
      });
    } else {
      const { error } = await supabase
        .from('services')
        .insert(serviceData);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to create service',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Service created successfully',
      });
    }

    resetForm();
    setDialogOpen(false);
    fetchServices();
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      duration_minutes: service.duration_minutes.toString(),
      image_url: service.image_url || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete service',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Service deleted successfully',
    });
    fetchServices();
  };

  const toggleActive = async (service: Service) => {
    const { error } = await supabase
      .from('services')
      .update({ is_active: !service.is_active })
      .eq('id', service.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update service status',
        variant: 'destructive',
      });
      return;
    }

    fetchServices();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration_minutes: '',
      image_url: '',
    });
    setEditingService(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Service Management</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Edit Service' : 'Add New Service'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Service Image</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  {uploading && <span className="text-sm text-muted-foreground">Uploading...</span>}
                </div>
                {formData.image_url && (
                  <img src={formData.image_url} alt="Preview" className="mt-2 h-32 w-32 object-cover rounded" />
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingService ? 'Update' : 'Create'} Service
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.id}>
            <CardHeader>
              {service.image_url && (
                <img src={service.image_url} alt={service.name} className="w-full h-48 object-cover rounded-lg mb-4" />
              )}
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{service.name}</CardTitle>
                <Badge variant={service.is_active ? 'default' : 'secondary'}>
                  {service.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{service.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">${service.price}</span>
                <span className="text-muted-foreground">{service.duration_minutes} min</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(service)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleActive(service)}
                >
                  {service.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(service.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ServiceManagement;
