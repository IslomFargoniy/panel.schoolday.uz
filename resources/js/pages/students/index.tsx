import { Head, useForm, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ImageModal } from '@/components/students/ImageModal';
import { StudentFilters } from '@/components/students/StudentFilters';
import { StudentForm } from '@/components/students/StudentForm';
import { StudentImportModal } from '@/components/students/StudentImportModal';
import { StudentsTable } from '@/components/students/StudentsTable';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import type {
    BreadcrumbItem,
    Student,
    SchoolClass,
    PaginatedResponse,
} from '@/types';

interface StudentsPageFilters {
    school_id?: string;
    branch_id?: string;
    shift_id?: string;
    class_id?: string;
    status?: string;
    search?: string;
    per_page?: string;
}

interface StudentsPageProps {
    students: PaginatedResponse<Student>;
    schools?: { id: number; name: string }[];
    branches?: { id: number; name: string; school_id?: number }[];
    shifts?: { id: number; name: string; branch_id?: number }[];
    classes: (SchoolClass & { shift_id?: number })[];
    filters: StudentsPageFilters;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function StudentsPage({
    students,
    schools = [],
    branches = [],
    shifts = [],
    classes,
    filters,
}: StudentsPageProps) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('students.title', 'Students'), href: '/students' },
    ];

    // ─── Filters ────────────────────────────────────────────────────────────────
    const [filterData, setFilterData] = useState({
        school_id: filters?.school_id || '',
        branch_id: filters?.branch_id || '',
        shift_id: filters?.shift_id || '',
        class_id: filters?.class_id || '',
        status: filters?.status || '',
        search: filters?.search || '',
        per_page: filters?.per_page || '20',
    });

    const handleFilterChange = (key: string, value: string) => {
        const next = { ...filterData, [key]: value };
        setFilterData(next);
        router.get('/students', next, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        const resetData = {
            school_id: '',
            branch_id: '',
            shift_id: '',
            class_id: '',
            status: '',
            search: '',
            per_page: '20',
        };
        setFilterData(resetData);
        router.get('/students', resetData, { preserveState: true, replace: true });
    };

    // ─── Form & Modals ──────────────────────────────────────────────────────────
    const [editing, setEditing] = useState<Student | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
    const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
    const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        data: formData,
        setData,
        post,
        delete: destroy,
        reset,
        errors,
        transform,
        clearErrors,
    } = useForm({
        name: '',
        phone: '',
        telegram_id: '',
        class_id: '',
        status: 'active',
        face_image: null as File | null,
        gender: 'unknown',
        user_verify_mode: 'face',
        local_ui_right: false,
        door_right: '1',
        plan_template_no: '1',
        valid_enabled: false,
        valid_begin: '',
        valid_end: '',
    });

    // ─── Handlers ────────────────────────────────────────────────────────────────
    const handleOpenCreate = () => {
        setEditing(null);
        setFormImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        reset();
        clearErrors();
        setIsFormModalOpen(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.class_id) {
            toast.error(t('students.class_required', 'Sinfni tanlash majburiy!'));
            return;
        }

        const targetEmployeeNo = editing
            ? editing.employeeNoString || String(editing.id)
            : Date.now().toString().slice(-8);

        transform((data) => ({ ...data, employeeNoString: targetEmployeeNo }));

        if (editing) {
            post(`/students/${editing.id}`, {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    setEditing(null);
                    setFormImagePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    reset();
                },
            });
        } else {
            post('/students', {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    setFormImagePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    reset(
                        'name',
                        'phone',
                        'telegram_id',
                        'status',
                        'face_image',
                        'gender',
                        'user_verify_mode',
                        'local_ui_right',
                        'door_right',
                        'plan_template_no',
                        'valid_enabled',
                        'valid_begin',
                        'valid_end',
                    );
                },
            });
        }
    };

    const handleEdit = (student: Student) => {
        setEditing(student);
        clearErrors();
        setFormImagePreview(student.face_image || null);
        setData({
            name: student.name || '',
            phone: student.phone || '',
            telegram_id: student.telegram_id || '',
            class_id: student.class_id ? String(student.class_id) : '',
            status: student.status || 'active',
            face_image: null,
            gender: student.gender || 'unknown',
            user_verify_mode: student.user_verify_mode || 'face',
            local_ui_right: student.local_ui_right ?? false,
            door_right: student.door_right || '1',
            plan_template_no: student.plan_template_no || '1',
            valid_enabled: student.valid_enabled ?? false,
            valid_begin: student.valid_begin
                ? student.valid_begin.slice(0, 16)
                : '',
            valid_end: student.valid_end ? student.valid_end.slice(0, 16) : '',
        });
        setIsFormModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!deleteStudent) return;
        destroy(`/students/${deleteStudent.id}`, {
            onSuccess: () => setDeleteStudent(null),
        });
    };

    const handleImageChange = (file: File | null) => {
        setData('face_image', file);
        if (file) {
            setFormImagePreview(URL.createObjectURL(file));
        } else {
            setFormImagePreview(editing?.face_image || null);
        }
    };

    const handleCancel = () => {
        setEditing(null);
        setFormImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        reset();
        clearErrors();
        setIsFormModalOpen(false);
    };

    // ─── Render ──────────────────────────────────────────────────────────────────
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('students.title', 'Students')} />

            <ImageModal
                imageUrl={imageModalUrl}
                onClose={() => setImageModalUrl(null)}
            />
            <StudentImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                classes={classes}
            />

            <div className="flex flex-col gap-4 p-4 sm:p-6 w-full min-w-0 max-w-full">
                <StudentFilters
                    filterData={filterData}
                    schools={schools}
                    branches={branches}
                    shifts={shifts}
                    classes={classes}
                    onFilterChange={handleFilterChange}
                    onClear={clearFilters}
                />

                <StudentsTable
                    students={students}
                    onEdit={handleEdit}
                    onDelete={(student) => setDeleteStudent(student)}
                    onImageClick={(url) => setImageModalUrl(url)}
                    onImportClick={() => setIsImportModalOpen(true)}
                    onCreate={handleOpenCreate}
                />
            </div>

            {/* Create / Edit Student Modal */}
            <Dialog
                open={isFormModalOpen}
                onOpenChange={(open) => {
                    setIsFormModalOpen(open);
                    if (!open) handleCancel();
                }}
            >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editing
                                ? t('students.edit', 'O‘quvchini tahrirlash')
                                : t('students.add_new', 'Yangi o‘quvchi qo‘shish')}
                        </DialogTitle>
                    </DialogHeader>
                    <StudentForm
                        editing={editing}
                        formData={formData}
                        errors={errors}
                        formImagePreview={formImagePreview}
                        classes={classes}
                        setData={setData}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        onImageChange={handleImageChange}
                        fileInputRef={fileInputRef}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmDialog
                open={deleteStudent !== null}
                onOpenChange={(open) => !open && setDeleteStudent(null)}
                onConfirm={handleConfirmDelete}
                title={t('students.delete_confirm_title', 'O‘quvchini o‘chirish')}
                description={t(
                    'students.delete_confirm',
                    'Ushbu o‘quvchini o‘chirishni tasdiqlaysizmi? Unga tegishli barcha davomat va ruxsat yozuvlari o‘chirilishi mumkin.',
                )}
            />
        </AppLayout>
    );
}
