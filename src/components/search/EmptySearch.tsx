import { Search } from "lucide-react";

export default function EmptySearch({ searched }: { searched: boolean }) {
    if (!searched) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                    <Search className="w-6 h-6 text-brand-400" />
                </div>
                <div>
                    <p className="font-display font-semibold text-base-100">
                        Find your next client
                    </p>
                    <p className="text-sm text-base-500 mt-1 max-w-xs">
                        Search any city for local businesses — restaurants,
                        salons, pharmacies and more.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-base-800 flex items-center justify-center">
                <Search className="w-6 h-6 text-base-500" />
            </div>
            <div>
                <p className="font-display font-semibold text-base-100">
                    No results found
                </p>
                <p className="text-sm text-base-500 mt-1 max-w-xs">
                    Try a different keyword or location. Be specific — "salon"
                    works better than "beauty services".
                </p>
            </div>
        </div>
    );
}
