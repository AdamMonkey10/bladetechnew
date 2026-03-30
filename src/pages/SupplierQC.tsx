import { useState } from "react";
import { Search, BarChart3, Map, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CoilMapViewer } from "@/components/qc/CoilMapViewer";

export default function SupplierQCPage() {
  const [batchNumber, setBatchNumber] = useState("");
  const [searchedBatch, setSearchedBatch] = useState("");

  const handleSearch = () => {
    if (batchNumber.trim()) {
      setSearchedBatch(batchNumber.trim());
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Quality Control Portal</h1>
        <p className="text-muted-foreground text-lg">
          Access your batch quality data, coil maps, and test results
        </p>
      </div>

      {/* Search Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Your Batch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter batch number (e.g., BATCH-2024-001)"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              Search
            </Button>
            {searchedBatch && (
              <Button variant="outline" onClick={() => {
                setSearchedBatch("");
                setBatchNumber("");
              }}>
                Clear
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Enter your batch number to view quality control data, coil maps, and test results.
          </p>
        </CardContent>
      </Card>

      {/* Results Section */}
      {searchedBatch && (
        <div className="mb-8">
          <CoilMapViewer batchNumber={searchedBatch} />
        </div>
      )}

      {/* Features Grid - Only show when no search results */}
      {!searchedBatch && (
        <>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Quality Data */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quality Data
                </CardTitle>
                <CardDescription>
                  View detailed quality control measurements and statistical process control charts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Test measurements
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    SPC charts and trends
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Pass/fail status
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Coil Maps */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Coil Maps
                </CardTitle>
                <CardDescription>
                  Interactive visual representation of your coil with any quality issues marked
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Visual fault mapping
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Position-specific details
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Severity indicators
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* API Access */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Database className="h-5 w-5" />
                API Access
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Programmatic access available for integration with your systems. Contact your quality team for API documentation.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}