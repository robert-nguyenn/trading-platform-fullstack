// src/components/strategy/blocks/OperandConfigurationPopover.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';
import {
    OperandKind,
    ConditionOperand,
    TechnicalIndicatorOperand,
    MacroIndicatorOperand,
    ValueOperand,
    TimeInterval,
    TechnicalIndicatorType, // Use Enum
    SeriesType,             // Use Enum
    TechnicalIndicatorParameters // Use Union Type
} from '@/lib/types';
import { INDICATOR_METADATA, getDefaultIndicatorParams } from '@/lib/indicatorMetadata'; // Import metadata
import { fetchAssets, DetailedAsset } from '@/lib/assetData'; // Import asset functions
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { ChevronDown, Check, Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';

export interface MacroIndicatorMetadata {
    path: string;
    method: 'get';
    description: string;
    fredSeriesId: string;
    tags: string[];
}

// --- Constants ---
const INTERVALS = Object.values(TimeInterval).map(v => ({ value: v, label: v }));
const DEBOUNCE_DELAY = 300;

// --- Component Props (No change needed) ---
interface OperandConfigurationPopoverProps {
    initialConfig: ConditionOperand;
    onSave: (config: ConditionOperand) => void;
    onCancel: () => void;
    trigger: React.ReactNode;
    align?: "start" | "center" | "end";
}

export const OperandConfigurationPopover: React.FC<OperandConfigurationPopoverProps> = ({
    initialConfig,
    onSave,
    onCancel,
    trigger,
    align = "start"
}) => {
    const [isOpen, setIsOpen] = useState(false);
    // State uses the ConditionOperand union type
    const [currentConfig, setCurrentConfig] = useState<ConditionOperand>(initialConfig);
    // Keep track of the *selected* kind for UI flow
    const [operandKindSelection, setOperandKindSelection] = useState<OperandKind | null>(initialConfig.kind);
    
    // Asset loading state
    const [availableAssets, setAvailableAssets] = useState<DetailedAsset[]>([]);
    const [loadingAssets, setLoadingAssets] = useState(false);

    // Load available assets on component mount
    useEffect(() => {
        const loadAssets = async () => {
            setLoadingAssets(true);
            try {
                const assets = await fetchAssets();
                setAvailableAssets(assets);
            } catch (error) {
                console.error('Failed to load assets:', error);
            } finally {
                setLoadingAssets(false);
            }
        };
        loadAssets();
    }, []);

    const [indicatorPopoverOpen, setIndicatorPopoverOpen] = useState(false);
    const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
    const [macroIndicatorPopoverOpen, setMacroIndicatorPopoverOpen] = useState(false);

    // --- State for Macro Indicators SEARCH ---
    const [macroSearchQuery, setMacroSearchQuery] = useState(''); // User's input
    const [macroSearchResults, setMacroSearchResults] = useState<MacroIndicatorMetadata[]>([]); // Results from API
    const [isLoadingMacroSearch, setIsLoadingMacroSearch] = useState<boolean>(false); // Loading state for search
    const [errorMacroSearch, setErrorMacroSearch] = useState<string | null>(null); // Error state for search

    // --- State for Macro Indicators SUGGESTIONS ---
    const [macroSuggestions, setMacroSuggestions] = useState<MacroIndicatorMetadata[]>([]);
    const [isLoadingMacroSuggestions, setIsLoadingMacroSuggestions] = useState<boolean>(false);
    const [errorMacroSuggestions, setErrorMacroSuggestions] = useState<string | null>(null); // Separate error state for suggestions

    const handleMacroPopoverOpenChange = (isOpen: boolean) => {
        console.log("handleMacroPopoverOpenChange called with:", isOpen); // <-- Add Log
        setMacroIndicatorPopoverOpen(isOpen);
    };

    // Ref to store the current config value for the trigger button display,
    // especially when the popover is closed but re-opens with a selection.
    const selectedMacroDescRef = useRef<string | null>(null);

    const fetchMacroSuggestions = useCallback(async () => {
        // Avoid fetching if already loaded or currently loading
        if (macroSuggestions.length > 0 || isLoadingMacroSuggestions) {
            console.log("Skipping suggestion fetch.");
            return; // Don't refetch suggestions every time popover opens unless needed
        }

        console.log("Fetching macro indicator suggestions...");
        setIsLoadingMacroSuggestions(true);
        setErrorMacroSuggestions(null);
        setMacroSuggestions([]); // Clear old suggestions
        try {
            // *** USE apiClient TO FETCH SUGGESTIONS ***
            // Adjust the endpoint as needed (e.g., '/fred/endpoints?popular=true')
            const response = await apiClient.get<MacroIndicatorMetadata[]>('/fred/suggestions');
            setMacroSuggestions(response.data);
        } catch (e: any) {
            console.error("Failed to fetch macro indicator suggestions:", e);
            const message = e.response?.data?.message || e.message || 'Failed to load suggestions.';
            setErrorMacroSuggestions(message);
            setMacroSuggestions([]); // Ensure empty on error
        } finally {
            setIsLoadingMacroSuggestions(false);
        }
    }, [isLoadingMacroSuggestions, macroSuggestions.length]); // Dependencies to prevent unnecessary fetches

    // --- Debounced Search Function ---
    const fetchMacroSearchResults = useCallback(async (query: string) => {
        if (!query || query.trim().length < 2) { // Optional: Minimum query length
            setMacroSearchResults([]); // Clear results if query is too short or empty
            setIsLoadingMacroSearch(false);
            setErrorMacroSearch(null);
            return;
        }

        console.log(`Fetching macro indicators for query: "${query}"`);
        setIsLoadingMacroSearch(true);
        setErrorMacroSearch(null);
        try {
            // Adjust API endpoint and query parameter as needed
            const response = await await apiClient.get<MacroIndicatorMetadata[]>('/fred/endpoints', {
                params: { search: query }
            });


            setMacroSearchResults(response.data);
        } catch (e: any) {
            console.error("Failed to fetch macro indicator search results:", e);
            const message = e.response?.data?.message || e.message || 'Search failed.';
            setErrorMacroSearch(message);
            setMacroSearchResults([]); // Clear results on error
        } finally {
            setIsLoadingMacroSearch(false);
        }
    }, []); // No dependencies needed if it only uses state setters

    const debouncedFetchMacroSearch = useRef(
        debounce(fetchMacroSearchResults, DEBOUNCE_DELAY)
    ).current;

    useEffect(() => {
        if (isOpen) {
            const initial = initialConfig ?? { kind: null }; // Ensure initial is defined
            setCurrentConfig(initialConfig);
            setOperandKindSelection(initialConfig.kind);


            // Store the description of the initially selected macro indicator (if any)
            if (initial.kind === OperandKind.MACRO_INDICATOR && initial.fredSeriesId) {
                selectedMacroDescRef.current = initial.description ?? null; // Use stored description
            } else {
                selectedMacroDescRef.current = null;
            }

            // Reset search state when popover opens
            setMacroSearchQuery('');
            setMacroSearchResults([]);
            setIsLoadingMacroSearch(false);
            setErrorMacroSearch(null);
            setErrorMacroSuggestions(null);

            fetchMacroSuggestions();

            // Close nested popovers
            setIndicatorPopoverOpen(false);
            setAssetPopoverOpen(false);
            setMacroIndicatorPopoverOpen(false);
        } else {
            // Cleanup debounce timer if popover is closed while request is pending
            debouncedFetchMacroSearch.cancel();
            selectedMacroDescRef.current = null; // Clear ref on close
        }
    }, [isOpen, initialConfig, debouncedFetchMacroSearch]);

    // --- Handler for Macro Search Input Change ---
    const handleMacroSearchChange = (query: string) => {
        setMacroSearchQuery(query); // Update input field immediately
        setIsLoadingMacroSearch(true); // Show loading indicator while waiting for debounce
        setErrorMacroSearch(null); // Clear previous errors
        debouncedFetchMacroSearch(query); // Call debounced API fetch
    };

    // --- Handler for Selecting a Macro Indicator from Search Results ---
    const handleMacroIndicatorSelect = (selectedIndicator: MacroIndicatorMetadata) => {
        const newConfig: MacroIndicatorOperand = {
            kind: OperandKind.MACRO_INDICATOR,
            fredSeriesId: selectedIndicator.fredSeriesId,
            description: selectedIndicator.description, // Store description too!
            indicatorType: selectedIndicator.description
        };
        setCurrentConfig(newConfig);
        selectedMacroDescRef.current = selectedIndicator.description; // Update ref for trigger button display
        setMacroIndicatorPopoverOpen(false); // Close the selection popover
        // Clear search state after selection
        setMacroSearchQuery('');
        setMacroSearchResults([]);
        setErrorMacroSearch(null);
        setIsLoadingMacroSearch(false);
    };

    // --- Main Save Logic ---
    // --- Main Save Logic ---
    const handleSaveClick = () => {
        let isValid = true;
        let configToSave = { ...currentConfig }; // Clone to avoid direct state mutation before save

        switch (configToSave.kind) {
            case OperandKind.TECHNICAL_INDICATOR:
                // --- Explicitly narrow the type for this scope ---
                const techConfigToSave: TechnicalIndicatorOperand = configToSave;
                // ------------------------------------------------

                const metadata = INDICATOR_METADATA[techConfigToSave.indicatorType];
                if (!metadata) {
                    isValid = false;
                    console.error(`Missing metadata for indicator type: ${techConfigToSave.indicatorType}`);
                } else {
                    if (metadata.requiresSymbol && !techConfigToSave.symbol) isValid = false;
                    if (metadata.requiresInterval && !techConfigToSave.interval) isValid = false;

                    // Make a mutable copy of parameters for conversion
                    let mutableParams: Record<string, any> = { ...(techConfigToSave.parameters ?? {}) };

                    // Check required parameters based on metadata
                    metadata.params.forEach(pMeta => {
                        // --- Access parameters using the narrowed type ---
                        const paramValue = mutableParams[pMeta.paramName];
                        // -------------------------------------------------

                        if (pMeta.required && (paramValue === undefined || paramValue === '')) {
                            console.warn(`Validation failed: Required param ${pMeta.paramName} missing for ${techConfigToSave.indicatorType}`);
                            isValid = false;
                        }

                        // Type conversion for numbers before saving
                        if (pMeta.inputType === 'number') {
                            const rawValue = paramValue; // Value from state (could be string)
                            const numValue = (rawValue === '' || rawValue === undefined || rawValue === null)
                                ? undefined
                                : Number(rawValue);

                            // Update the temporary mutable parameters object
                            mutableParams[pMeta.paramName] = numValue;

                            // Validate required numbers after conversion attempt
                            if (pMeta.required && (numValue === undefined || isNaN(numValue))) {
                                console.warn(`Validation failed: Required number param ${pMeta.paramName} is invalid for ${techConfigToSave.indicatorType}`);
                                isValid = false;
                            }
                        }
                        // Add else if for other input types if needed
                    });

                    // Update the configToSave with the potentially converted parameters
                    configToSave = { ...techConfigToSave, parameters: mutableParams as TechnicalIndicatorParameters };
                }
                break;

            case OperandKind.MACRO_INDICATOR:
                {
                    const macroConfigToSave = configToSave as MacroIndicatorOperand;
                    // Description is helpful but ID is essential for backend lookup
                    if (!macroConfigToSave.fredSeriesId || macroConfigToSave.fredSeriesId === '') {
                        isValid = false;
                        console.warn(`Validation failed: A Macroeconomic Indicator must be selected.`);
                    }
                    // Ensure description is present if ID is (should be handled by handleMacroIndicatorSelect)
                    if (macroConfigToSave.fredSeriesId && !macroConfigToSave.description) {
                        console.warn(`Validation warning: Macro indicator description missing for ${macroConfigToSave.fredSeriesId}. Saving anyway.`);
                        // Maybe allow save, but log warning? Or mark invalid? Depends on requirements.
                        // isValid = false;
                    }
                }
                break;

            case OperandKind.VALUE:
                let numericValue = configToSave.value;
                if (typeof configToSave.value === 'string') {
                    numericValue = parseFloat(configToSave.value);
                    if (isNaN(numericValue)) {
                        // Decide how to handle invalid number input for 'Value' operand
                        console.warn(`Validation failed: Invalid number input for VALUE operand: ${configToSave.value}`);
                        // Option 1: Keep original string (might cause issues later)
                        // numericValue = configToSave.value;
                        // Option 2: Invalidate the save
                        isValid = false;
                        numericValue = ''; // Clear it or keep original invalid string?
                    }
                }
                if (numericValue === '' || numericValue === undefined || numericValue === null) isValid = false;
                // Update the configToSave with the parsed/validated value
                configToSave = { ...configToSave, value: numericValue };
                break;

            case null:
                isValid = false;
                break;
        }

        if (isValid) {
            onSave(configToSave);
            setIsOpen(false);
        } else {
            console.error("Operand configuration is incomplete or invalid. Cannot save.", configToSave);
            // TODO: Show validation error feedback to the user (e.g., using toasts)
        }
    };

    const handleCancelClick = () => {
        onCancel();
        setIsOpen(false);
    };

    const handleKindSelect = (kind: OperandKind) => {
        setOperandKindSelection(kind);
        selectedMacroDescRef.current = null;
        // Reset config based on selected kind
        switch (kind) {
            case OperandKind.VALUE:
                setCurrentConfig({ kind: OperandKind.VALUE, value: '' });
                break;
            case OperandKind.TECHNICAL_INDICATOR:
                // Set initial type and default params for a *default* indicator (e.g., SMA)
                const defaultIndicator = TechnicalIndicatorType.SMA;
                setCurrentConfig({
                    kind: OperandKind.TECHNICAL_INDICATOR,
                    indicatorType: defaultIndicator,
                    symbol: null,
                    interval: null,
                    parameters: getDefaultIndicatorParams(defaultIndicator) as TechnicalIndicatorParameters // Use helper
                });
                break;
            case OperandKind.MACRO_INDICATOR:
                setCurrentConfig({ kind: OperandKind.MACRO_INDICATOR, indicatorType: '' });
                break;
        }
    };

    // --- Technical Indicator Specific Handlers ---

    // Handles changes to top-level properties (symbol, interval) and parameter object keys
    const handleTechParamChange = useCallback((key: keyof TechnicalIndicatorOperand | string, value: any) => {
        setCurrentConfig(prev => {
            if (prev.kind !== OperandKind.TECHNICAL_INDICATOR) return prev; // Type guard

            if (key === 'symbol' || key === 'interval') {
                return { ...prev, [key]: value };
            } else {
                // Update nested parameters object
                return {
                    ...prev,
                    parameters: {
                        ...prev.parameters,
                        [key]: value // Update the specific parameter key
                    } as TechnicalIndicatorParameters // Assert type after update
                };
            }
        });
    }, []);


    // Handle main indicator type selection (e.g., SMA, EMA)
    const handleIndicatorTypeSelect = (indicatorTypeValue: string) => {
        const newType = indicatorTypeValue as TechnicalIndicatorType;
        // Update state with new type and its default parameters
        setCurrentConfig(prev => {
            if (prev.kind !== OperandKind.TECHNICAL_INDICATOR) return prev; // Should not happen here
            return {
                ...prev,
                indicatorType: newType,
                parameters: getDefaultIndicatorParams(newType) as TechnicalIndicatorParameters // Reset params
            };
        });
        setIndicatorPopoverOpen(false); // Close popover
    };

    // Handle asset selection
    const handleAssetSelect = (assetValue: string | null) => {
        handleTechParamChange('symbol', assetValue);
        setAssetPopoverOpen(false); // Close popover
    };


    // --- Dynamic UI Rendering ---
    const renderConfigurationUI = () => {
        switch (operandKindSelection) {
            case OperandKind.VALUE:
                // Same as before
                return (
                    <div className="space-y-2">
                        <Label htmlFor="op-value-input">Value*</Label>
                        <Input
                            id="op-value-input"
                            type="number" // Keep as number input
                            step="any"
                            value={(currentConfig as ValueOperand).value ?? ''}
                            // Store as string in state, parse on save
                            onChange={(e) => setCurrentConfig({ kind: OperandKind.VALUE, value: e.target.value })}
                            placeholder="Enter a number"
                            className='h-8'
                        />
                    </div>
                );

            case OperandKind.TECHNICAL_INDICATOR:
                const techConfig = currentConfig as TechnicalIndicatorOperand;
                const currentIndicatorMetadata = INDICATOR_METADATA[techConfig.indicatorType]; // Get metadata

                return (
                    <div className="space-y-3">
                        {/* Indicator Type Selection */}
                        <div className="space-y-1">
                            <Label>Technical Indicator*</Label>
                            <Popover open={indicatorPopoverOpen} onOpenChange={setIndicatorPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" aria-expanded={indicatorPopoverOpen} className="w-full justify-between h-8 text-xs">
                                        {INDICATOR_METADATA[techConfig.indicatorType]?.label || "Select indicator"}
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search indicators..." className="h-9" />
                                        <CommandList>
                                            <CommandEmpty>No indicator found.</CommandEmpty>
                                            <CommandGroup>
                                                {/* Use Object.entries on Enum and filter by metadata */}
                                                {Object.entries(TechnicalIndicatorType)
                                                    .filter(([_, value]) => !!INDICATOR_METADATA[value]) // Ensure metadata exists
                                                    .map(([key, value]) => (
                                                        <CommandItem
                                                            key={value}
                                                            value={INDICATOR_METADATA[value].label} // Search by label
                                                            onSelect={() => handleIndicatorTypeSelect(value)}
                                                            className="text-xs"
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", techConfig.indicatorType === value ? "opacity-100" : "opacity-0")} />
                                                            {INDICATOR_METADATA[value].label}
                                                        </CommandItem>
                                                    ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Asset Selection (Show only if required by metadata) */}
                        {currentIndicatorMetadata?.requiresSymbol && (
                            <div className="space-y-1">
                                <Label>Asset/Symbol*</Label>
                                <Popover open={assetPopoverOpen} onOpenChange={setAssetPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" aria-expanded={assetPopoverOpen} className="w-full justify-between h-8 text-xs">
                                            {availableAssets.find(asset => asset.symbol === techConfig.symbol)?.name || "Select asset"}
                                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search assets..." className="h-9" />
                                            <CommandList>
                                                <CommandEmpty>
                                                    {loadingAssets ? "Loading assets..." : "No asset found."}
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {availableAssets.map((asset) => (
                                                        <CommandItem
                                                            key={asset.symbol}
                                                            value={`${asset.symbol} - ${asset.name}`}
                                                            onSelect={() => handleAssetSelect(asset.symbol)}
                                                            className="text-xs"
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", techConfig.symbol === asset.symbol ? "opacity-100" : "opacity-0")} />
                                                            <span className="font-medium mr-2">{asset.symbol}</span>
                                                            <span className="text-muted-foreground">{asset.name}</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}

                        {/* Interval Selection (Show only if required by metadata) */}
                        {currentIndicatorMetadata?.requiresInterval && (
                            <div className="space-y-1">
                                <Label className="text-xs">Interval*</Label>
                                <Select onValueChange={(value) => handleTechParamChange('interval', value as TimeInterval)} value={techConfig.interval || ""}>
                                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select interval" /></SelectTrigger>
                                    <SelectContent>
                                        {INTERVALS.map(item => <SelectItem key={item.value} value={item.value} className='text-xs'>{item.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}


                        {/* Dynamic Parameters Area based on Metadata */}
                        {currentIndicatorMetadata && currentIndicatorMetadata.params.length > 0 && (
                            <div className="space-y-3 border border-slate-200 dark:border-slate-700 rounded-md p-3 pt-2 bg-slate-50/50 dark:bg-slate-900/50">
                                <h4 className="text-xs font-medium text-muted-foreground -ml-1">Indicator Parameters</h4>
                                {currentIndicatorMetadata.params.map((paramMeta) => (
                                    // Optional: Add conditional rendering based on paramMeta.condition
                                    <div key={paramMeta.paramName} className="space-y-1">
                                        <Label htmlFor={`param-${paramMeta.paramName}`} className="text-xs">
                                            {paramMeta.label}{paramMeta.required ? '*' : ''}
                                        </Label>
                                        {paramMeta.inputType === 'number' ? (
                                            <Input
                                                id={`param-${paramMeta.paramName}`}
                                                type="number"
                                                value={(techConfig.parameters as Record<string, any>)[paramMeta.paramName] ?? ''}
                                                onChange={(e) => handleTechParamChange(paramMeta.paramName, e.target.value)} // Store as string initially
                                                placeholder={paramMeta.placeholder}
                                                min={paramMeta.min}
                                                max={paramMeta.max}
                                                step={paramMeta.step}
                                                className="h-8 text-xs"
                                                required={paramMeta.required}
                                            />
                                        ) : paramMeta.inputType === 'select' ? (
                                            <Select
                                                value={(techConfig.parameters as Record<string, any>)[paramMeta.paramName] ?? ""}
                                                onValueChange={(value) => handleTechParamChange(paramMeta.paramName, value)}
                                                required={paramMeta.required}
                                            >
                                                <SelectTrigger id={`param-${paramMeta.paramName}`} className="h-8 text-xs">
                                                    <SelectValue placeholder={paramMeta.placeholder || `Select ${paramMeta.label}`} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(paramMeta.options || []).map(option => (
                                                        <SelectItem key={option.value.toString()} value={option.value.toString()} className='text-xs'>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : null /* Add other input types */}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case OperandKind.MACRO_INDICATOR:
                // Use the stored description from currentConfig or the ref for the trigger button
                const displayDescription = (currentConfig.kind === OperandKind.MACRO_INDICATOR ? currentConfig.description : null) ?? selectedMacroDescRef.current;
                const showSuggestions = !macroSearchQuery && !isLoadingMacroSearch && !errorMacroSearch && macroSearchResults.length === 0;
                const showEmptyState = !isLoadingMacroSearch && !errorMacroSearch && macroSearchResults.length === 0 && !isLoadingMacroSuggestions && !errorMacroSuggestions && macroSuggestions.length === 0;

                return (
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label>Macroeconomic Indicator*</Label>
                            <Popover open={macroIndicatorPopoverOpen} onOpenChange={handleMacroPopoverOpenChange}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={macroIndicatorPopoverOpen}
                                        className="w-full justify-between h-8 text-xs"
                                    >
                                        <span className="truncate">
                                            {displayDescription || "Select indicator"}
                                        </span>
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Search indicators (e.g., CPI, GDP)..." // Updated placeholder
                                            className="h-9"
                                            value={macroSearchQuery}
                                            onValueChange={handleMacroSearchChange}
                                        />
                                        <CommandList>
                                            {/* --- Priority Order for Display --- */}

                                            {/* 1. Search Loading */}
                                            {isLoadingMacroSearch && (
                                                <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center">
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...
                                                </div>
                                            )}

                                            {/* 2. Search Error */}
                                            {!isLoadingMacroSearch && errorMacroSearch && (
                                                <div className="p-4 text-center text-xs text-destructive">
                                                    Error searching: {errorMacroSearch}
                                                </div>
                                            )}

                                            {/* 3. Search Results */}
                                            {!isLoadingMacroSearch && !errorMacroSearch && macroSearchResults.length > 0 && (
                                                <CommandGroup heading="Search Results">
                                                    {macroSearchResults.map((indicator) => (
                                                        <CommandItem
                                                            key={indicator.fredSeriesId}
                                                            onSelect={() => handleMacroIndicatorSelect(indicator)}
                                                            className="text-xs cursor-pointer"
                                                        >
                                                            <span className='flex-grow truncate pr-2'>{indicator.description}</span>
                                                            <span className="text-muted-foreground text-[10px] shrink-0">({indicator.fredSeriesId})</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            )}

                                            {/* 4. Show Suggestions (only if not searching/no search results/errors) */}
                                            {showSuggestions && (
                                                <>
                                                    {/* 4a. Suggestion Loading */}
                                                    {isLoadingMacroSuggestions && (
                                                        <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center">
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading suggestions...
                                                        </div>
                                                    )}
                                                    {/* 4b. Suggestion Error */}
                                                    {!isLoadingMacroSuggestions && errorMacroSuggestions && (
                                                        <div className="p-4 text-center text-xs text-destructive">
                                                            Error loading suggestions: {errorMacroSuggestions}
                                                        </div>
                                                    )}
                                                    {/* 4c. Suggestions List */}
                                                    {!isLoadingMacroSuggestions && !errorMacroSuggestions && macroSuggestions.length > 0 && (
                                                        <CommandGroup heading="Suggestions">
                                                            {macroSuggestions.map((indicator) => (
                                                                <CommandItem
                                                                    key={indicator.fredSeriesId}
                                                                    onSelect={() => handleMacroIndicatorSelect(indicator)} // Re-use the same handler
                                                                    className="text-xs cursor-pointer"
                                                                >
                                                                    <span className='flex-grow truncate pr-2'>{indicator.description}</span>
                                                                    <span className="text-muted-foreground text-[10px] shrink-0">({indicator.fredSeriesId})</span>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    )}
                                                </>
                                            )}


                                            {/* 5. Empty State (only if nothing else is shown) */}
                                            {/* Show only if not loading/erroring on search OR suggestions, and no results/suggestions available */}
                                            {!isLoadingMacroSearch && !errorMacroSearch && macroSearchResults.length === 0 &&
                                                !isLoadingMacroSuggestions && !errorMacroSuggestions && macroSuggestions.length === 0 && (
                                                    <CommandEmpty>
                                                        {macroSearchQuery.length > 1 ? 'No indicators found.' : 'Type 2+ characters to search.'}
                                                    </CommandEmpty>
                                                )}

                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        {/* ... Optional parameters placeholder ... */}
                    </div>
                );

            default: // Initial Kind Selection
                // Same as before
                return (
                    <div className="grid grid-cols-1 gap-2">
                        <Button variant="outline" className="justify-start h-9 text-sm" onClick={() => handleKindSelect(OperandKind.TECHNICAL_INDICATOR)}>Technical Indicator</Button>
                        <Button variant="outline" className="justify-start h-9 text-sm" onClick={() => handleKindSelect(OperandKind.MACRO_INDICATOR)}>Macro Indicator</Button>
                        <Button variant="outline" className="justify-start h-9 text-sm" onClick={() => handleKindSelect(OperandKind.VALUE)}>Static Value</Button>
                    </div>
                );
        }
    };

    // --- Final JSX (No change needed in the outer structure) ---
    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            <PopoverContent className="w-80 p-4 space-y-4" align={align}>
                {renderConfigurationUI()}
                {operandKindSelection && (
                    <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-700 mt-4">
                        <Button variant="ghost" size="sm" onClick={handleCancelClick}>Cancel</Button>
                        <Button size="sm" onClick={handleSaveClick}>Save</Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};