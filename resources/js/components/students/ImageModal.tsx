import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

interface ImageModalProps {
    imageUrl: string | null;
    onClose: () => void;
}

export function ImageModal({ imageUrl, onClose }: ImageModalProps) {
    const { t } = useTranslation();
    return (
        <Dialog open={!!imageUrl} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="flex justify-center overflow-hidden border-none bg-transparent p-0 shadow-none sm:max-w-2xl"
                aria-describedby="student-photo-description"
            >
                <DialogTitle className="sr-only">
                    {t('students.student_photo', 'Student Photo')}
                </DialogTitle>
                <DialogDescription
                    id="student-photo-description"
                    className="sr-only"
                >
                    {t(
                        'students.full_photo_desc',
                        'A full size photo of the student.',
                    )}
                </DialogDescription>
                {imageUrl && (
                    <p className="bg-transparent text-center">
                        <img
                            src={imageUrl}
                            alt="Face"
                            className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl"
                        />
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
}
