"use client";

import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table as ShadcnTable,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import DeleteConfirmModal from "@/components/main/DeleteConfirmModal";


export default function AdminPage() {
    return (

        <main className="flex flex-1 flex-col px-4 transition-colors">
            <Toaster />
            <div className="w-full max-w-7xl mx-auto px-4 py-8">
                <AdminTables />
            </div>
        </main>
    );
}

function AdminTables() {
    const [tables, setTables] = useState<string[]>([]);
    const [selected, setSelected] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/admin/get-tables")
            .then((res) => res.json())
            .then((json) => {
                if (json.error) {
                    toast.error(json.error);
                    return;
                }
                setTables(json.tables || []);
                if (json.tables?.length) {
                    setSelected(json.tables[0]);
                }
            });
    }, []);

    if (!tables.length)
        return <div className="py-10 text-center">Нет доступных таблиц</div>;

    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-4">
                {tables.map((t) => (
                    <Button
                        key={t}
                        variant={selected === t ? "default" : "outline"}
                        onClick={() => setSelected(t)}
                    >
                        {t}
                    </Button>
                ))}
            </div>
            {selected && <DataTable tableName={selected} />}
        </div>
    );
}

function EditableCell(key: string, table: string) {
    return function CellComponent({ row }: { row: any }) {
        const [value, setValue] = useState(row.original[key]);
        const [loading, setLoading] = useState(false);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setValue(e.target.value);
        };

        const handleBlur = async () => {
            if (value === row.original[key]) return;
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/${table}/${row.original._id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ [key]: value }),
                });
                const json = await res.json();
                if (res.ok) {
                    row.original[key] = value;
                    toast.success("Обновлено");
                } else {
                    toast.error(json.error || "Ошибка обновления");
                }
            } catch (e) {
                toast.error("Ошибка сети или сервера");
            } finally {
                setLoading(false);
            }
        };

        return (
            <Input
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                className="h-8 text-sm min-w-[200px]"
            />
        );
    };
}

function DataTable({ tableName }: { tableName: string }) {
    const [columns, setColumns] = useState<ColumnDef<any, any>[]>([]);
    const [data, setData] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10); // можно брать из ответа API
    const [total, setTotal] = useState(0); // общее количество записей
    const [hasMore, setHasMore] = useState(true);

    const [field, setField] = useState<string>("");
    const [query, setQuery] = useState<string>("");

    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    // Функция для нормализации и удобного отображения любых типов значений из MongoDB
    function formatValue(value: any): string {
        if (value === null || value === undefined) return "";
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            return String(value);
        }
        if (Array.isArray(value)) {
            return value.map(formatValue).join(", ");
        }
        if (value?._bsontype === "ObjectID" || value?.$oid) {
            return value.$oid || value.toString();
        }
        if (value?.$numberDecimal) {
            return value.$numberDecimal;
        }
        if (value?.$timestamp) {
            return `Timestamp(${value.$timestamp.t},${value.$timestamp.i})`; // без пробелов
        }
        if (value?.low !== undefined && value?.high !== undefined) {
            return `Long(${value.high},${value.low})`; // без пробелов
        }
        if (value?.$binary) {
            return `Binary(subType:${value.$binary.subType},base64:${value.$binary.base64})`;
        }
        if (value?.$uuid) {
            return `UUID(${value.$uuid})`;
        }
        if (typeof value === "object") {
            try {
                // JSON.stringify без пробелов и переносов
                return JSON.stringify(value);
            } catch {
                return "[Object]";
            }
        }
        return String(value);
    }




    const fetchPage = async (pageNum: number, q: string, f: string) => {
        try {
            const params = new URLSearchParams({
                page: pageNum.toString(),
                limit: limit.toString(),
            });
            if (f && q) {
                params.set("field", f);
                params.set("q", q);
            }
            const res = await fetch(`/api/admin/${tableName}?${params.toString()}`);
            const json = await res.json();
            if (json.error) {
                toast.error(json.error);
                return;
            }
            const items = json.data || [];
            setData(items);
            setPage(json.page || pageNum);
            setLimit(json.limit || limit);
            setTotal(json.total || 0);
            setHasMore(items.length === json.limit);


            if (items[0]) {

                const cols: ColumnDef<any, any>[] = Object.keys(items[0]).map((k) => ({
                    accessorKey: k,
                    header: k,
                    cell:
                        k === "_id"
                            ? ({ row }: { row: any }) => <div className="pl-2">{formatValue(row.original._id)}</div>
                            : ({ row }: { row: any }) => {
                                // Если значение — простой тип string/number/boolean, рендерим EditableCell, иначе просто отформатированный текст
                                const val = row.original[k];
                                const isSimple =
                                    val === null ||
                                    val === undefined ||
                                    typeof val === "string" ||
                                    typeof val === "number" ||
                                    typeof val === "boolean";
                                if (isSimple) {
                                    // Используем EditableCell для редактирования простых типов
                                    const CellComp = EditableCell(k, tableName);
                                    return <CellComp row={row} />;
                                } else {
                                    // Для сложных типов просто выводим форматированный текст
                                    return <div>{formatValue(val)}</div>;
                                }
                            },
                }));

                // Кнопка удаления
                cols.push({
                    id: "actions",
                    header: "Действия",
                    cell: ({ row }) => (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                                setDeleteTargetId(row.original._id);
                                setShowConfirm(true);
                            }}
                        >
                            Удалить
                        </Button>
                    ),
                });

                setColumns(cols);

                if (!field) {
                    // По умолчанию выбираем для поиска поле email, если есть, иначе первое поле
                    setField(items[0].email ? "email" : Object.keys(items[0])[0]);
                }
            } else {
                setColumns([]);
                setField("");
            }
        } catch (error) {
            toast.error("Ошибка загрузки данных");
        }
    };


    useEffect(() => {
        setField("");
        setQuery("");
        fetchPage(1, "", "");
    }, [tableName]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    const handleDelete = async () => {
        if (!deleteTargetId) return;
        try {
            const res = await fetch(`/api/admin/${tableName}/${deleteTargetId}`, {
                method: "DELETE",
            });
            const json = await res.json();
            if (res.ok) {
                toast.success("Удалено");
                setDeleteTargetId(null);
                setShowConfirm(false);
                fetchPage(page, query.trim(), field); // Обновить текущую страницу
            } else {
                toast.error(json.error || "Ошибка удаления");
            }
        } catch (e) {
            toast.error("Ошибка сети");
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="w-full">
            <DeleteConfirmModal
                open={showConfirm}
                onCancel={() => setShowConfirm(false)}
                onConfirm={handleDelete}
                title="Удалить запись?"
                description="Вы уверены, что хотите удалить эту запись? Это действие необратимо."
            />

            <div className="flex gap-2 items-center py-4">
                <Select
                    onValueChange={(v) => setField(v)}
                    value={field}
                //   disabled={columns.length === 0}
                >
                    <SelectTrigger className="w-30">
                        <SelectValue placeholder="Выберите поле" />
                    </SelectTrigger>
                    <SelectContent>
                        {columns
                            .filter((c: any) => c.accessorKey)
                            .map((c: any) => (
                                <SelectItem key={c.accessorKey as string} value={c.accessorKey as string}>
                                    {c.accessorKey}
                                </SelectItem>
                            ))}
                    </SelectContent>
                </Select>

                <Input
                    placeholder="Введите значение для поиска (подстрока для типа string, точное значение для других типов)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1"
                />

                <Button onClick={() => fetchPage(1, query.trim(), field)}>Найти</Button>
            </div>

            <div className="rounded-md border overflow-x-auto">
                <ShadcnTable>
                    <TableHeader>
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id}>
                                {hg.headers.map((h) => (
                                    <TableHead key={h.id}>
                                        {h.isPlaceholder
                                            ? null
                                            : flexRender(h.column.columnDef.header, h.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length || 1} className="h-24 text-center">
                                    Нет данных.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </ShadcnTable>
            </div>

            <div className="flex items-center mt-4 justify-end gap-2 text-sm text-muted-foreground">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPage(page - 1, query.trim(), field)}
                    disabled={page === 1}
                >
                    Назад
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPage(page + 1, query.trim(), field)}
                    disabled={page === totalPages || totalPages === 0}
                >
                    Вперёд
                </Button>

                <span className="px-2 text-xs">
                    Страница <strong>{page}</strong> из <strong>{totalPages}</strong>
                </span>

                <span className="px-2 text-xs">
                    Всего записей: <strong>{total}</strong>
                </span>
            </div>
        </div>
    );
}

