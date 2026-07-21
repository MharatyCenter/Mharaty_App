import React, { useState } from 'react';

interface Trainer {
  id: number;
  name: string;
  title: string;
  bio: string;
  image: string;
}

export default function TrainerManager() {
  const [trainers, setTrainers] = useState<Trainer[]>([
    {
      id: 1,
      name: "أحمد محمد",
      title: "خبير الأمن السيبراني",
      bio: "متخصص في أمن الشبكات والاختراق الأخلاقي.",
      image: "https://via.placeholder.com/150"
    }
  ]);

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  // إضافة أو تعديل مدرب
  const handleSaveTrainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !title) return;

    if (editingId !== null) {
      // تعديل
      setTrainers(trainers.map(t => t.id === editingId ? { ...t, name, title, bio, image: image || t.image } : t));
      setEditingId(null);
    } else {
      // إضافة جديد
      const newTrainer: Trainer = {
        id: Date.now(),
        name,
        title,
        bio,
        image: image || 'https://via.placeholder.com/150'
      };
      setTrainers([...trainers, newTrainer]);
    }

    // تفريغ الحقول
    setName('');
    setTitle('');
    setBio('');
    setImage('');
  };

  // تجهيز بيانات المدرب للتعديل
  const handleEdit = (trainer: Trainer) => {
    setEditingId(trainer.id);
    setName(trainer.name);
    setTitle(trainer.title);
    setBio(trainer.bio);
    setImage(trainer.image);
  };

  // حذف مدرب
  const handleDelete = (id: number) => {
    setTrainers(trainers.filter(t => t.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md mt-6" dir="rtl">
      <h2 className="text-2xl font-bold mb-6 text-indigo-700">إدارة المدربين (إضافة، تعديل، حذف)</h2>

      {/* نموذج الإضافة أو التعديل */}
      <form onSubmit={handleSaveTrainer} className="bg-gray-50 p-4 rounded-lg mb-8 border">
        <h3 className="text-lg font-semibold mb-4">{editingId !== null ? 'تعديل بيانات المدرب' : 'إضافة مدرب جديد'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="اسم المدرب"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-2 border rounded-md"
            required
          />
          <input
            type="text"
            placeholder="التخصص أو المسمى الوظيفي"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="p-2 border rounded-md"
            required
          />
        </div>
        <div className="mb-4">
          <textarea
            placeholder="نبذة مختصرة عن المدرب"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="p-2 border rounded-md w-full"
          />
        </div>
        <div className="mb-4">
          <input
            type="text"
            placeholder="رابط الصورة الشخصية (URL)"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="p-2 border rounded-md w-full"
          />
        </div>
        <button
          type="submit"
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition"
        >
          {editingId !== null ? 'تحديث البيانات' : 'حفظ وإضافة المدرب'}
        </button>
        {editingId !== null && (
          <button
            type="button"
            onClick={() => { setEditingId(null); setName(''); setTitle(''); setBio(''); setImage(''); }}
            className="mr-3 bg-gray-400 text-white px-6 py-2 rounded-md hover:bg-gray-500 transition"
          >
            إلغاء التعديل
          </button>
        )}
      </form>

      {/* جدول عرض المدربين */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white text-right">
          <thead>
            <tr className="bg-indigo-50 text-indigo-900 border-b">
              <th className="p-3">الصورة</th>
              <th className="p-3">الاسم</th>
              <th className="p-3">التخصص</th>
              <th className="p-3">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {trainers.map((trainer) => (
              <tr key={trainer.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <img src={trainer.image} alt={trainer.name} className="w-10 h-10 rounded-full object-cover" />
                </td>
                <td className="p-3 font-medium">{trainer.name}</td>
                <td className="p-3 text-gray-600">{trainer.title}</td>
                <td className="p-3 space-x-2 space-x-reverse">
                  <button
                    onClick={() => handleEdit(trainer)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(trainer.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}