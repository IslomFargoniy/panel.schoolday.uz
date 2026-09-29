import { useForm } from '@inertiajs/react';
import { Plus, UserPlus } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { StudentForm } from '@/components/students/StudentForm';
import type { Branch, SchoolClass, Student } from '@/types';

interface CreateBranchStudentModalProps {
    branch: Branch;
    classes: SchoolClass[];
    defaultClassId?: number | string;
    studentToEdit?: Student | null;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export default function CreateBranchStudentModal({
    branch,
    classes,
    defaultClassId,
    studentToEdit,
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    trigger,
}: CreateBranchStudentModalProps) {
    const { t } = useTranslation();
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : uncontrolledOpen;
    const setOpen = isControlled ? setControlledOpen! : setUncontrolledOpen;

    const initialClassId = defaultClassId
        ? String(defaultClassId)
        : classes[0]?.id
          ? String(classes[0].id)
          : '';

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: studentToEdit?.name || '',
        phone: studentToEdit?.phone || '',
        telegram_id: studentToEdit?.telegram_id || '',
        class_id: studentToEdit?.class_id ? String(studentToEdit.class_id) : initialClassId,
        status: studentToEdit?.status || 'active',
        face_image: null as File | null,
        gender: (studentToEdit as any)?.gender || 'unknown',
        user_verify_mode: (studentToEdit as any)?.user_verify_mode || 'cardOrFace',
        local_ui_right: (studentToEdit as any)?.local_ui_right || false,
        door_right: (studentToEdit as any)?.door_right || '1',
        plan_template_no: (studentToEdit as any)?.plan_template_no || '1',
        valid_enabled: (studentToEdit as any)?.valid_enabled || false,
        valid_begin: (studentToEdit as any)?.valid_begin || '2024-01-01 00:00:00',
        valid_end: (studentToEdit as any)?.valid_end || '2037-12-31 23:59:59',
    });

    const [formImagePreview, setFormImagePreview] = useState<string | null>(
        studentToEdit?.face_image || null,
    );

    React.useEffect(() => {
        if (studentToEdit) {
            setData({
                name: studentToEdit.name || '',
                phone: studentToEdit.phone || '',
                telegram_id: studentToEdit.telegram_id || '',
                class_id: studentToEdit.class_id ? String(studentToEdit.class_id) : initialClassId,
                status: studentToEdit.status || 'active',
                face_image: null,
                gender: (studentToEdit as any).gender || 'unknown',
                user_verify_mode: (studentToEdit as any).user_verify_mode || 'cardOrFace',
                local_ui_right: (studentToEdit as any).local_ui_right || false,
                door_right: (studentToEdit as any).door_right || '1',
                plan_template_no: (studentToEdit as any).plan_template_no || '1',
                valid_enabled: (studentToEdit as any).valid_enabled || false,
                valid_begin: (studentToEdit as any).valid_begin || '2024-01-01 00:00:00',
                valid_end: (studentToEdit as any).valid_end || '2037-12-31 23:59:59',
            });
            setFormImagePreview(studentToEdit.face_image || null);
        } else {
            reset();
            if (defaultClassId) setData('class_id', String(defaultClassId));
            setFormImagePreview(null);
        }
    }, [studentToEdit, open]);

    const handleImageChange = (file: File | null) => {
        setData('face_image', file);
        if (file) {
            setFormImagePreview(URL.createObjectURL(file));
        } else {
            setFormImagePreview(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (studentToEdit) {
            put(`/students/${studentToEdit.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(t('student_updated', 'O‘quvchi ma’lumotlari yangilandi'));
                    setOpen(false);
                },
                onError: (err) => {
                    toast.error(Object.values(err)[0] as string || 'Xatolik yuz berdi');
                },
            });
        } else {
            post('/students', {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(t('student_created', 'Yangi o‘quvchi muvaffaqiyatli qo‘shildi'));
                    reset();
                    clearErrors();
                    setOpen(false);
                },
                onError: (err) => {
                    toast.error(Object.values(err)[0] as string || 'Xatolik yuz berdi');
                },
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    {trigger || (
                        <Button size="sm" className="gap-1.5 h-8 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t('add_student', 'O‘quvchi qo‘shish')}</span>
                        </Button>
                    )}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-5">
                <DialogHeader className="mb-2">
                    <DialogTitle className="flex items-center gap-2 text-base font-bold">
                        <UserPlus className="w-5 h-5 text-indigo-600" />
                        <span>
                            {studentToEdit
                                ? t('edit_student', 'O‘quvchini tahrirlash')
                                : t('add_new_student', 'Yangi o‘quvchi qo‘shish')}
                        </span>
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        {branch.name} filialidagi sinfga o‘quvchi biriktirish va Hikvision Face ID parametrlarini sozlash.
                    </DialogDescription>
                </DialogHeader>

                <StudentForm
                    editing={studentToEdit}
                    formData={data}
                    errors={errors as any}
                    formImagePreview={formImagePreview}
                    classes={classes}
                    setData={(key, val) => setData(key as any, val)}
                    onSubmit={handleSubmit}
                    onCancel={() => setOpen(false)}
                    onImageChange={handleImageChange}
                />
            </DialogContent>
        </Dialog>
    );
}
