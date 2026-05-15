import { useEffect, useMemo, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import InfoRow from '../../components/InfoRow';
import { Input, Select } from '../../components/Input';
import MetricCard from '../../components/MetricCard';
import Modal from '../../components/Modal';
import Table from '../../components/Table';
import { formatDateDisplay } from '../../lib/date';
const FLOORS = ['All', 'GF', '1F', '2F', '3F'];
const statusBadge = (s) => {
    if (s === 'occupied') return <Badge variant="red">Occupied</Badge>;
    if (s === 'reserved') return <Badge variant="blue">Reserved</Badge>;
    if (s === 'expiring') return <Badge variant="amber">Expiring</Badge>;
    if (s === 'overdue') return <Badge variant="red">Overdue</Badge>;
    return <Badge variant="gray">Vacant</Badge>;
};
const floorLabel = {
    GF: 'Ground Floor',
    '1F': '1st Floor',
    '2F': '2nd Floor',
    '3F': '3rd Floor',
};
const statusColor = {
    occupied: 'bg-red-50 border border-red-200 text-red-600',
    reserved: 'bg-blue-50 border border-blue-200 text-blue-700',
    expiring: 'bg-amber-50 border border-amber-200 text-amber-700',
    overdue: 'bg-red-50 border border-red-200 text-red-600',
    vacant: 'bg-[#FAF8F4] border border-dashed border-[#1B2B4B]/20 text-[#5C6B88]',
};
export default function UnitsPage({ openAddSignal = 0 }) {
    const {
        units: unitRows,
        archivedUnits: archivedUnitRows,
        tenants: tenantRows,
    } = usePage().props;
    const mappedUnits = (unitRows ?? []).map((unit) => ({
        id: unit.id,
        number: unit.number,
        floor: unit.floor,
        type: unit.type,
        area: unit.area,
        baseRent: unit.base_rent,
        status: unit.status,
        tenantName: unit.tenant?.name ?? null,
        tenantId: unit.tenant_id,
        description: unit.description ?? '',
        gallery: unit.gallery ?? [],
    }));
    const mappedArchivedUnits = (archivedUnitRows ?? []).map((unit) => ({
        id: unit.id,
        number: unit.number,
        floor: unit.floor,
        type: unit.type,
        area: unit.area,
        baseRent: unit.base_rent,
        status: unit.status,
        tenantName: unit.tenant?.name ?? null,
        tenantId: unit.tenant_id,
        description: unit.description ?? '',
        gallery: unit.gallery ?? [],
    }));
    const [units, setUnits] = useState(mappedUnits);
    const [archivedUnits, setArchivedUnits] = useState(mappedArchivedUnits);
    const [viewMode, setViewMode] = useState('active');
    const [view, setView] = useState('grid');
    const [floor, setFloor] = useState('All');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [addForm, setAddForm] = useState({
        number: '',
        floor: '1F',
        type: 'Office',
        area: '',
        baseRent: '',
        status: 'vacant',
        description: '',
        galleryFiles: [],
    });
    const [addErrors, setAddErrors] = useState({});
    const [editForm, setEditForm] = useState({ galleryFiles: [] });
    const [editErrors, setEditErrors] = useState({});
    const lastHandledSignal = useRef(openAddSignal);
    useEffect(() => {
        setUnits(mappedUnits);
        if (openAddSignal !== lastHandledSignal.current) {
            setAddOpen(true);
            lastHandledSignal.current = openAddSignal;
        }
    }, [openAddSignal, unitRows]);
    useEffect(() => {
        setArchivedUnits(mappedArchivedUnits);
    }, [archivedUnitRows]);
    useEffect(() => {
        if (viewMode === 'archived' && view === 'grid') {
            setView('table');
        }
        if (viewMode !== 'active') {
            setDetailOpen(false);
            setEditOpen(false);
            setSelected(null);
        }
    }, [viewMode, view]);
    const visibleUnits = viewMode === 'active' ? units : archivedUnits;
    const filtered = useMemo(() => {
        return visibleUnits.filter((u) => {
            const floorMatch = floor === 'All' || u.floor === floor;
            const searchTerm = search.toLowerCase();
            const searchMatch =
                u.number.toLowerCase().includes(searchTerm) ||
                u.type.toLowerCase().includes(searchTerm) ||
                (u.tenantName ?? '').toLowerCase().includes(searchTerm);
            return floorMatch && searchMatch;
        });
    }, [visibleUnits, floor, search]);
    const occupied = units.filter((u) => u.status !== 'vacant').length;
    const vacant = units.filter((u) => u.status === 'vacant').length;
    const expiring = units.filter((u) => u.status === 'expiring').length;
    const occupancyPct =
        units.length > 0 ? Math.round((occupied / units.length) * 100) : 0;
    const tenant = selected?.tenantId
        ? (tenantRows ?? []).find((t) => t.id === selected.tenantId)
        : null;
    const restoreUnit = (unitId) => {
        if (!window.confirm('Restore this unit?')) {
            return;
        }
        router.post(`/admin/units/${unitId}/restore`);
    };
    const tableColumns = [
        { key: 'number', label: 'Unit', width: 80 },
        { key: 'floor', label: 'Floor', width: 80 },
        { key: 'type', label: 'Type' },
        { key: 'area', label: 'Area', render: (v) => `${v} sqm` },
        {
            key: 'baseRent',
            label: 'Base Rent',
            align: 'right',
            render: (v) => (
                <span className="font-semibold">P{v.toLocaleString()}</span>
            ),
        },
        {
            key: 'tenantName',
            label: 'Tenant',
            render: (v) =>
                v ? (
                    <span className="text-[#1B2B4B]">{v}</span>
                ) : (
                    <span className="text-[#5C6B88]">Vacant</span>
                ),
        },
        {
            key: 'status',
            label: 'Status',
            align: 'center',
            render: (v) => statusBadge(v),
        },
        {
            key: 'id',
            label: '',
            width: 80,
            align: 'right',
            render: (_, row) => (
                viewMode === 'active' ? (
                    <Button
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelected(row);
                            setDetailOpen(true);
                        }}
                    >
                        View
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        size="xs"
                        onClick={(e) => {
                            e.stopPropagation();
                            restoreUnit(row.id);
                        }}
                    >
                        Restore
                    </Button>
                )
            ),
        },
    ];
    const saveNewUnit = () => {
        const errors = {};
        const normalizedNumber = addForm.number.trim().toUpperCase();

        if (!normalizedNumber) {
            errors.number = 'Unit number is required.';
        } else if (
            units.some(
                (unit) => unit.number.trim().toUpperCase() === normalizedNumber,
            )
        ) {
            errors.number = 'Unit number already exists.';
        }

        if (!addForm.area || Number(addForm.area) <= 0) {
            errors.area = 'Area must be greater than 0.';
        }

        if (!addForm.baseRent || Number(addForm.baseRent) < 0) {
            errors.baseRent = 'Base rent is required.';
        }

        if (Object.keys(errors).length > 0) {
            setAddErrors(errors);
            return;
        }

        const formData = new FormData();
        formData.append('number', normalizedNumber);
        formData.append('floor', addForm.floor);
        formData.append('type', addForm.type);
        formData.append('area', Number(addForm.area));
        formData.append('base_rent', Number(addForm.baseRent));
        formData.append('status', addForm.status);
        formData.append('description', addForm.description);

        (addForm.galleryFiles ?? []).forEach((file) => {
            formData.append('gallery[]', file);
        });

        router.post('/admin/units', formData, {
            forceFormData: true,
            onSuccess: () => {
                setAddForm({
                    number: '',
                    floor: '1F',
                    type: 'Office',
                    area: '',
                    baseRent: '',
                    status: 'vacant',
                    description: '',
                    galleryFiles: [],
                });
                setAddErrors({});
                setAddOpen(false);
            },
            onError: (errors) => {
                setAddErrors(errors || {});
            },
        });
    };
    const startEdit = () => {
        if (!selected) return;
        setEditForm({
            ...selected,
            galleryFiles: [],
        });
        setEditOpen(true);
    };
    const saveEdit = () => {
        if (!selected) return;
        const errors = {};
        const normalizedNumber = String(editForm.number ?? '')
            .trim()
            .toUpperCase();

        if (!normalizedNumber) {
            errors.number = 'Unit number is required.';
        } else if (
            units.some(
                (unit) =>
                    unit.id !== selected.id &&
                    unit.number.trim().toUpperCase() === normalizedNumber,
            )
        ) {
            errors.number = 'Unit number already exists.';
        }

        if (!editForm.area || Number(editForm.area) <= 0) {
            errors.area = 'Area must be greater than 0.';
        }

        if (!editForm.baseRent || Number(editForm.baseRent) < 0) {
            errors.baseRent = 'Base rent is required.';
        }

        if (Object.keys(errors).length > 0) {
            setEditErrors(errors);
            return;
        }

        const hasNewFiles = (editForm.galleryFiles ?? []).length > 0;
        const payload = {
            number: normalizedNumber,
            floor: editForm.floor,
            area: editForm.area,
            base_rent: editForm.baseRent,
            status: editForm.status,
            type: editForm.type,
            tenant_id: editForm.tenantId,
            description: editForm.description,
        };

        if (!hasNewFiles) {
            router.patch(`/admin/units/${selected.id}`, payload, {
                onSuccess: () => {
                    setEditErrors({});
                    setEditOpen(false);
                },
                onError: (errors) => {
                    setEditErrors(errors || {});
                },
            });
            return;
        }

        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, value);
            }
        });
        (editForm.galleryFiles ?? []).forEach((file) => {
            formData.append('gallery[]', file);
        });

        router.patch(`/admin/units/${selected.id}`, formData, {
            forceFormData: true,
            onSuccess: () => {
                setEditErrors({});
                setEditOpen(false);
            },
            onError: (errors) => {
                setEditErrors(errors || {});
            },
        });
    };
    const deleteUnit = () => {
        if (!selected) {
            return;
        }
        if (
            !window.confirm(
                `Archive unit ${selected.number}? You can restore it later.`,
            )
        ) {
            return;
        }
        router.delete(`/admin/units/${selected.id}`, {
            onSuccess: () => {
                setDetailOpen(false);
                setEditOpen(false);
                setSelected(null);
            },
        });
    };
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-4 gap-4">
                <MetricCard
                    label="Total Units"
                    value={units.length}
                    sub="Across all floors"
                />
                <MetricCard
                    label="Occupied"
                    value={occupied}
                    sub={`${occupancyPct}% occupancy`}
                    trend="up"
                />
                <MetricCard
                    label="Vacant"
                    value={vacant}
                    sub="Available now"
                    trend="down"
                    iconBg="bg-red-50 text-red-400"
                />
                <MetricCard
                    label="Expiring Soon"
                    value={expiring}
                    sub="Within 30 days"
                    trend="down"
                    iconBg="bg-amber-50 text-amber-500"
                />
            </div>

            <Card>
                <Card.Header
                    title="Unit Overview"
                    action={
                        <div className="flex items-center gap-2">
                            <div className="flex gap-0.5 rounded-lg bg-[#F5F0E8] p-0.5">
                                {['active', 'archived'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setViewMode(tab)}
                                        className={[
                                            'rounded-md px-3 py-1 text-xs font-medium capitalize transition-all',
                                            viewMode === tab
                                                ? 'bg-white text-[#1B2B4B] shadow-sm'
                                                : 'text-[#5C6B88] hover:text-[#1B2B4B]',
                                        ].join(' ')}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            <Input
                                placeholder="Search unit, type, tenant..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-52"
                            />
                            <div className="flex gap-0.5 rounded-lg bg-[#F5F0E8] p-0.5">
                                {FLOORS.map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFloor(f)}
                                        className={[
                                            'rounded-md px-3 py-1 text-xs font-medium transition-all',
                                            floor === f
                                                ? 'bg-white text-[#1B2B4B] shadow-sm'
                                                : 'text-[#5C6B88] hover:text-[#1B2B4B]',
                                        ].join(' ')}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-0.5 rounded-lg bg-[#F5F0E8] p-0.5">
                                {['grid', 'table'].map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => setView(v)}
                                        className={[
                                            'rounded-md px-3 py-1 text-xs font-medium capitalize transition-all',
                                            view === v
                                                ? 'bg-white text-[#1B2B4B] shadow-sm'
                                                : 'text-[#5C6B88] hover:text-[#1B2B4B]',
                                        ].join(' ')}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                            {viewMode === 'active' && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => setAddOpen(true)}
                                >
                                    + Add Unit
                                </Button>
                            )}
                        </div>
                    }
                />

                {viewMode === 'active' && view === 'grid' ? (
                    <Card.Body>
                        {(floor === 'All'
                            ? ['GF', '1F', '2F', '3F']
                            : [floor]
                        ).map((fl) => {
                            const floorUnits = filtered.filter(
                                (u) => u.floor === fl,
                            );
                            if (floorUnits.length === 0) return null;
                            return (
                                <div key={fl} className="mb-6 last:mb-0">
                                    <p className="mb-3 text-xs font-semibold tracking-wider text-[#5C6B88] uppercase">
                                        {floorLabel[fl]}
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        {floorUnits.map((u) => (
                                            <button
                                                key={u.id}
                                                onClick={() => {
                                                    setSelected(u);
                                                    setDetailOpen(true);
                                                }}
                                                className={[
                                                    'min-w-27.5 rounded-xl px-4 py-3 text-left transition-all hover:scale-[1.02]',
                                                    statusColor[u.status],
                                                ].join(' ')}
                                            >
                                                <p className="mb-0.5 text-sm font-bold">
                                                    {u.number}
                                                </p>
                                                <p className="max-w-22.5 truncate text-[10px] opacity-70">
                                                    {u.tenantName ?? '-'}
                                                </p>
                                                <p className="mt-1 text-[10px] opacity-60">
                                                    {u.type}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </Card.Body>
                ) : (
                    <>
                        <Table
                            columns={tableColumns}
                            data={filtered}
                            keyField={'id'}
                            onRowClick={(row) => {
                                if (viewMode !== 'active') {
                                    return;
                                }
                                setSelected(row);
                                setDetailOpen(true);
                            }}
                        />
                        <Card.Footer>
                            Showing {filtered.length} units
                        </Card.Footer>
                    </>
                )}
            </Card>

            {selected && (
                <Modal
                    open={detailOpen}
                    onClose={() => setDetailOpen(false)}
                    title={`Unit ${selected.number}`}
                    size="md"
                    footer={
                        viewMode === 'active' ? (
                            <>
                                <Button variant="danger" onClick={deleteUnit}>
                                                            Archive Unit
                                </Button>
                                <Button
                                    variant="outline"
                                    className="ml-2"
                                    onClick={startEdit}
                                >
                                    Edit Unit
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="primary"
                                onClick={() => restoreUnit(selected.id)}
                            >
                                Restore Unit
                            </Button>
                        )
                    }
                >
                    <div className="mb-4 flex items-center gap-3 border-b border-[#1B2B4B]/8 pb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1D7B6E]/10 text-sm font-bold text-[#1D7B6E]">
                            {selected.number}
                        </div>
                        <div>
                            <p className="font-semibold text-[#1B2B4B]">
                                {floorLabel[selected.floor]} · {selected.type}
                            </p>
                            <p className="text-sm text-[#5C6B88]">
                                {selected.area} sqm
                            </p>
                        </div>
                        {statusBadge(selected.status)}
                    </div>

                    <InfoRow
                        label="Base Rent"
                        value={`P${selected.baseRent.toLocaleString()}/mo`}
                    />
                    <InfoRow label="Floor" value={floorLabel[selected.floor]} />
                    <InfoRow label="Unit Type" value={selected.type} />
                    <InfoRow label="Area" value={`${selected.area} sqm`} />

                    {selected.description && (
                        <div className="mt-4 rounded-2xl bg-[#FAF8F4] p-4 text-sm text-[#42506b]">
                            {selected.description}
                        </div>
                    )}

                    {selected.gallery?.length > 0 && (
                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                            {selected.gallery.slice(0, 3).map((photo, index) => (
                                <img
                                    key={`${photo}-${index}`}
                                    src={photo}
                                    alt={`Unit ${selected.number} image ${index + 1}`}
                                    className="h-24 w-full rounded-xl object-cover"
                                />
                            ))}
                        </div>
                    )}

                    {tenant ? (
                        <>
                            <div className="mt-4 mb-2">
                                <p className="text-[11px] font-bold tracking-wider text-[#5C6B88] uppercase">
                                    Current Tenant
                                </p>
                            </div>
                            <InfoRow label="Name" value={tenant.name} />
                            <InfoRow label="Contact" value={tenant.contact} />
                            <InfoRow
                                label="Lease End"
                                value={formatDateDisplay(tenant.lease_end, '-')}
                            />
                            <InfoRow
                                label="Monthly Rent"
                                value={`P${tenant.rent.toLocaleString()}`}
                                border={false}
                            />
                        </>
                    ) : (
                        <div className="mt-4 rounded-xl bg-[#FAF8F4] p-4 text-center">
                            <p className="text-sm text-[#5C6B88]">
                                This unit is currently vacant.
                            </p>
                        </div>
                    )}
                </Modal>
            )}

            <Modal
                open={addOpen}
                onClose={() => setAddOpen(false)}
                title="Add New Unit"
                size="md"
                footer={
                    <>
                        <Button
                            variant="ghost"
                            onClick={() => setAddOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={saveNewUnit}>
                            Save Unit
                        </Button>
                    </>
                }
            >
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                        <Input
                            label="Unit Number *"
                            value={addForm.number}
                            onChange={(e) => {
                                setAddForm((f) => ({
                                    ...f,
                                    number: e.target.value,
                                }));
                                if (addErrors.number) {
                                    setAddErrors((e) => ({
                                        ...e,
                                        number: undefined,
                                    }));
                                }
                            }}
                            full
                        />
                        {addErrors.number && (
                            <p className="mt-1 text-xs text-red-600">
                                {addErrors.number}
                            </p>
                        )}
                    </div>
                    <Select
                        label="Floor"
                        value={addForm.floor}
                        onChange={(e) =>
                            setAddForm((f) => ({ ...f, floor: e.target.value }))
                        }
                        full
                    >
                        <option value="GF">GF</option>
                        <option value="1F">1F</option>
                        <option value="2F">2F</option>
                        <option value="3F">3F</option>
                    </Select>
                    <Select
                        label="Type"
                        value={addForm.type}
                        onChange={(e) =>
                            setAddForm((f) => ({ ...f, type: e.target.value }))
                        }
                        full
                    >
                        <option value="Office">Office</option>
                        <option value="Retail">Retail</option>
                        <option value="Medical">Medical</option>
                    </Select>
                    <Select
                        label="Status"
                        value={addForm.status}
                        onChange={(e) =>
                            setAddForm((f) => ({
                                ...f,
                                status: e.target.value,
                            }))
                        }
                        full
                    >
                        <option value="vacant">Vacant</option>
                        <option value="occupied">Occupied</option>
                        <option value="expiring">Expiring</option>
                        <option value="overdue">Overdue</option>
                    </Select>
                    <div className="col-span-1">
                        <Input
                            label="Area (sqm) *"
                            type="number"
                            value={addForm.area}
                            onChange={(e) => {
                                setAddForm((f) => ({
                                    ...f,
                                    area: e.target.value,
                                }));
                                if (addErrors.area) {
                                    setAddErrors((e) => ({
                                        ...e,
                                        area: undefined,
                                    }));
                                }
                            }}
                            full
                        />
                        {addErrors.area && (
                            <p className="mt-1 text-xs text-red-600">
                                {addErrors.area}
                            </p>
                        )}
                    </div>
                    <div className="col-span-1">
                        <Input
                            label="Base Rent *"
                            type="number"
                            value={addForm.baseRent}
                            onChange={(e) => {
                                setAddForm((f) => ({
                                    ...f,
                                    baseRent: e.target.value,
                                }));
                                if (addErrors.baseRent) {
                                    setAddErrors((e) => ({
                                        ...e,
                                        baseRent: undefined,
                                    }));
                                }
                            }}
                            full
                        />
                        {addErrors.baseRent && (
                            <p className="mt-1 text-xs text-red-600">
                                {addErrors.baseRent}
                            </p>
                        )}
                    </div>
                    <div className="col-span-2">
                        <label className="mb-2 block text-sm font-medium text-[#1B2B4B]">
                            Description
                        </label>
                        <textarea
                            rows={4}
                            value={addForm.description}
                            onChange={(e) =>
                                setAddForm((f) => ({
                                    ...f,
                                    description: e.target.value,
                                }))
                            }
                            className="w-full rounded-xl border border-[#D3D8E0] bg-white px-3 py-2 text-sm text-[#1B2B4B] outline-none focus:border-[#1d7b6e]"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="mb-2 block text-sm font-medium text-[#1B2B4B]">
                            Upload Images
                        </label>
                        <Input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) =>
                                setAddForm((f) => ({
                                    ...f,
                                    galleryFiles: Array.from(e.target.files ?? []),
                                }))
                            }
                            full
                        />
                        {(addForm.galleryFiles ?? []).length > 0 && (
                            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                {addForm.galleryFiles.map((file, index) => (
                                    <img
                                        key={`${file.name}-${index}`}
                                        src={URL.createObjectURL(file)}
                                        alt={`Preview ${index + 1}`}
                                        className="h-24 w-full rounded-xl object-cover"
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {selected && (
                <Modal
                    open={editOpen}
                    onClose={() => setEditOpen(false)}
                    title="Edit Unit"
                    size="md"
                    footer={
                        <>
                            <Button variant="danger" onClick={deleteUnit}>
                                Archive Unit
                            </Button>
                            <Button
                                variant="primary"
                                className="ml-2"
                                onClick={saveEdit}
                            >
                                Save Changes
                            </Button>
                        </>
                    }
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <Input
                                label="Unit Number *"
                                value={String(editForm.number ?? '')}
                                onChange={(e) => {
                                    setEditForm((f) => ({
                                        ...f,
                                        number: e.target.value,
                                    }));
                                    if (editErrors.number) {
                                        setEditErrors((e) => ({
                                            ...e,
                                            number: undefined,
                                        }));
                                    }
                                }}
                                full
                            />
                            {editErrors.number && (
                                <p className="mt-1 text-xs text-red-600">
                                    {editErrors.number}
                                </p>
                            )}
                        </div>
                        <Select
                            label="Floor"
                            value={String(editForm.floor ?? '1F')}
                            onChange={(e) =>
                                setEditForm((f) => ({
                                    ...f,
                                    floor: e.target.value,
                                }))
                            }
                            full
                        >
                            <option value="GF">GF</option>
                            <option value="1F">1F</option>
                            <option value="2F">2F</option>
                            <option value="3F">3F</option>
                        </Select>
                        <div className="col-span-1">
                            <Input
                                label="Area (sqm) *"
                                type="number"
                                value={String(editForm.area ?? '')}
                                onChange={(e) => {
                                    setEditForm((f) => ({
                                        ...f,
                                        area: Number(e.target.value),
                                    }));
                                    if (editErrors.area) {
                                        setEditErrors((e) => ({
                                            ...e,
                                            area: undefined,
                                        }));
                                    }
                                }}
                                full
                            />
                            {editErrors.area && (
                                <p className="mt-1 text-xs text-red-600">
                                    {editErrors.area}
                                </p>
                            )}
                        </div>
                        <div className="col-span-1">
                            <Input
                                label="Base Rent *"
                                type="number"
                                value={String(editForm.baseRent ?? '')}
                                onChange={(e) => {
                                    setEditForm((f) => ({
                                        ...f,
                                        baseRent: Number(e.target.value),
                                    }));
                                    if (editErrors.baseRent) {
                                        setEditErrors((e) => ({
                                            ...e,
                                            baseRent: undefined,
                                        }));
                                    }
                                }}
                                full
                            />
                            {editErrors.baseRent && (
                                <p className="mt-1 text-xs text-red-600">
                                    {editErrors.baseRent}
                                </p>
                            )}
                        </div>
                        <div className="col-span-2">
                            <label className="mb-2 block text-sm font-medium text-[#1B2B4B]">
                                Description
                            </label>
                            <textarea
                                rows={4}
                                value={String(editForm.description ?? '')}
                                onChange={(e) =>
                                    setEditForm((f) => ({
                                        ...f,
                                        description: e.target.value,
                                    }))
                                }
                                className="w-full rounded-xl border border-[#D3D8E0] bg-white px-3 py-2 text-sm text-[#1B2B4B] outline-none focus:border-[#1d7b6e]"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="mb-2 block text-sm font-medium text-[#1B2B4B]">
                                Upload Replacement Images
                            </label>
                            <Input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) =>
                                    setEditForm((f) => ({
                                        ...f,
                                        galleryFiles: Array.from(e.target.files ?? []),
                                    }))
                                }
                                full
                            />
                            {(editForm.galleryFiles ?? []).length > 0 && (
                                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                    {editForm.galleryFiles.map((file, index) => (
                                        <img
                                            key={`${file.name}-${index}`}
                                            src={URL.createObjectURL(file)}
                                            alt={`Preview ${index + 1}`}
                                            className="h-24 w-full rounded-xl object-cover"
                                        />
                                    ))}
                                </div>
                            )}
                            {selected.gallery?.length > 0 && (
                                <div className="mt-4 rounded-2xl bg-[#F5F0E8] p-3 text-sm text-[#5C6B88]">
                                    Current images will remain unless new files are uploaded.
                                </div>
                            )}
                        </div>
                        <Select
                            label="Status"
                            value={String(editForm.status ?? 'vacant')}
                            onChange={(e) =>
                                setEditForm((f) => ({
                                    ...f,
                                    status: e.target.value,
                                }))
                            }
                            full
                        >
                            <option value="vacant">Vacant</option>
                            <option value="occupied">Occupied</option>
                            <option value="expiring">Expiring</option>
                            <option value="overdue">Overdue</option>
                        </Select>
                    </div>
                </Modal>
            )}
        </div>
    );
}
